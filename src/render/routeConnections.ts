import { buildPortIndex, describePort } from "../model/lookup";
import type { Connection, Rack } from "../model/types";
import type { Rect } from "../layout/geometry";
import type { PortLayout, RackViewLayout } from "../layout/types";

/** Abstand zwischen parallelen Kabelspuren rechts vom Rack. */
const LANE_SPACING_MM = 7;
/**
 * Leitungen verlassen einen Port nach unten in einen "Kanal" innerhalb der
 * freien Fläche unter der Portreihe, statt seitlich auf Höhe der Beschriftung
 * zu verlaufen - so überdecken sie nie die Portnummer/den Steckertyp eines
 * Nachbar-Ports, egal wie viele Verbindungen durch dieselbe Zeile laufen.
 * CHANNEL_BASE + (SLOTS-1)*CHANNEL_STEP muss innerhalb des freien Bereichs
 * unter dem Port bleiben (siehe PORT_HEIGHT_MM vs. HU_HEIGHT_MM).
 */
const CHANNEL_BASE_MM = 2.5;
const CHANNEL_STEP_MM = 2.2;
const CHANNEL_SLOTS = 6;

export interface RoutedConnection {
  connection: Connection;
  path: string;
  /** Natürliche Höhe für die Beschriftung, bevor Kollisionsvermeidung greift. */
  labelY: number;
}

export interface ConnectionStub {
  connection: Connection;
  path: string;
  dot: { x: number; y: number };
  /** Kurzbeschreibung der (hier nicht sichtbaren) Gegenstelle, für die Beschriftung. */
  otherEndLabel: string;
}

export interface RoutingResult {
  routed: RoutedConnection[];
  stubs: ConnectionStub[];
  /** Rechter Rand, den die Kabelspuren maximal erreichen (für Canvas-Breite). */
  laneExtentX: number;
}

/**
 * Ordnet jeder Verbindung, deren beide Ports in dieser Ansicht sichtbar sind,
 * eine eigene Kabelspur rechts vom Rack zu (Manhattan-Routing statt direkter
 * Linie quer durchs Rack). Verbindungen mit nur einem sichtbaren Port
 * (z.B. Gegenstelle auf der Rückseite) werden als kurzer Stich mit
 * Connection-ID dargestellt, statt eine Linie ins Leere zu ziehen.
 */
export function routeConnections(
  rack: Rack,
  layout: RackViewLayout,
  laneStartX: number,
): RoutingResult {
  const portIndex = buildPortIndex(rack);
  const visiblePorts = new Map<string, PortLayout>();
  for (const item of [...layout.items, ...layout.looseItems]) {
    for (const portLayout of item.ports) {
      visiblePorts.set(portLayout.port.id, portLayout);
    }
  }

  const routed: RoutedConnection[] = [];
  const stubs: ConnectionStub[] = [];
  let laneIndex = 0;
  let channelSlot = 0;

  for (const connection of rack.connections) {
    const aVisible = visiblePorts.get(connection.portAId);
    const bVisible = visiblePorts.get(connection.portBId);

    if (aVisible && bVisible) {
      const laneX = laneStartX + laneIndex * LANE_SPACING_MM;
      laneIndex += 1;
      routed.push(
        buildRoutedConnection(connection, aVisible.rect, bVisible.rect, laneX, channelSlot),
      );
      channelSlot += 1;
      continue;
    }

    const visible = aVisible ?? bVisible;
    if (!visible) continue; // beide Enden liegen außerhalb dieser Ansicht

    const farPortId = aVisible ? connection.portBId : connection.portAId;
    const farPort = portIndex.get(farPortId);
    const otherEndLabel = farPort ? describePort(rack, farPort) : farPortId;

    const markerX = laneStartX - 4; // knapp vor den Kabelspuren, am Rack-Rand
    stubs.push(buildStub(connection, visible.rect, markerX, otherEndLabel, channelSlot));
    channelSlot += 1;
  }

  const laneExtentX = laneStartX + Math.max(laneIndex, 1) * LANE_SPACING_MM;
  return { routed, stubs, laneExtentX };
}

/** Kanaltiefe unterhalb eines Ports, zyklisch über CHANNEL_SLOTS Stufen. */
function channelDrop(slot: number): number {
  return CHANNEL_BASE_MM + (slot % CHANNEL_SLOTS) * CHANNEL_STEP_MM;
}

function buildRoutedConnection(
  connection: Connection,
  rectA: Rect,
  rectB: Rect,
  laneX: number,
  channelSlot: number,
): RoutedConnection {
  const xA = rectA.x + rectA.width / 2;
  const xB = rectB.x + rectB.width / 2;
  const portBottomA = rectA.y + rectA.height;
  const portBottomB = rectB.y + rectB.height;
  const channelA = portBottomA + channelDrop(channelSlot);
  const channelB = portBottomB + channelDrop(channelSlot);

  const path = [
    `M ${xA} ${portBottomA}`,
    `L ${xA} ${channelA}`,
    `L ${laneX} ${channelA}`,
    `L ${laneX} ${channelB}`,
    `L ${xB} ${channelB}`,
    `L ${xB} ${portBottomB}`,
  ].join(" ");

  // Anker auf Höhe des oberen Kanals statt auf halber Strecke: die Mitte
  // zwischen zwei beliebigen Ports kann zufällig auf einer fremden
  // Gerätezeile landen. Die endgültige Position bekommt noch eine
  // Kollisionsvermeidung verpasst (siehe placeLabels in renderRackView).
  const labelY = Math.min(channelA, channelB);

  return { connection, path, labelY };
}

function buildStub(
  connection: Connection,
  rect: Rect,
  markerX: number,
  otherEndLabel: string,
  channelSlot: number,
): ConnectionStub {
  const x = rect.x + rect.width / 2;
  const portBottom = rect.y + rect.height;
  const channel = portBottom + channelDrop(channelSlot);

  const path = [`M ${x} ${portBottom}`, `L ${x} ${channel}`, `L ${markerX} ${channel}`].join(" ");

  return { connection, path, dot: { x: markerX, y: channel }, otherEndLabel };
}
