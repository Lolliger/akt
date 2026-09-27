import { buildPortIndex, describePort } from "../model/lookup";
import type { Connection, Port, Rack } from "../model/types";
import type { Rect } from "../layout/geometry";
import type { PortLayout, RackViewLayout } from "../layout/types";

/** Abstand zwischen parallelen Kabelspuren rechts vom Rack. */
const LANE_SPACING_MM = 7;
/**
 * Schrittweite für den Höhenversatz am Port. Ohne diesen Versatz liegen die
 * horizontalen Linienstücke zweier Verbindungen exakt übereinander, wenn sie
 * aus derselben Geräte-Reihe kommen bzw. in dieselbe münden (alle Ports einer
 * Reihe teilen sich eine Y-Koordinate) - der Spurabstand allein hilft dann
 * nichts, weil nur das kurze Stück an der Spur selbst einen Versatz hätte.
 */
const EXIT_OFFSET_STEP_MM = 1.6;
const EXIT_OFFSET_SLOTS = 5;

export interface RoutedConnection {
  connection: Connection;
  path: string;
  /** Natürliche Höhe für die Beschriftung, bevor Kollisionsvermeidung greift. */
  labelY: number;
}

export interface ConnectionStub {
  connection: Connection;
  port: Port;
  rect: Rect;
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

  for (const connection of rack.connections) {
    const aVisible = visiblePorts.get(connection.portAId);
    const bVisible = visiblePorts.get(connection.portBId);

    if (aVisible && bVisible) {
      const laneX = laneStartX + laneIndex * LANE_SPACING_MM;
      routed.push(
        buildRoutedConnection(connection, aVisible.rect, bVisible.rect, laneX, laneIndex),
      );
      laneIndex += 1;
      continue;
    }

    const visible = aVisible ?? bVisible;
    if (!visible) continue; // beide Enden liegen außerhalb dieser Ansicht

    const farPortId = aVisible ? connection.portBId : connection.portAId;
    const farPort = portIndex.get(farPortId);
    const otherEndLabel = farPort ? describePort(rack, farPort) : farPortId;

    stubs.push({ connection, port: visible.port, rect: visible.rect, otherEndLabel });
  }

  const laneExtentX = laneStartX + Math.max(laneIndex, 1) * LANE_SPACING_MM;
  return { routed, stubs, laneExtentX };
}

function buildRoutedConnection(
  connection: Connection,
  rectA: Rect,
  rectB: Rect,
  laneX: number,
  laneIndex: number,
): RoutedConnection {
  // Versatz innerhalb der Portbox, damit sich Linien aus/zu derselben Reihe
  // nicht auf einer gemeinsamen Höhe überlagern (siehe EXIT_OFFSET_STEP_MM).
  const slot = (laneIndex % EXIT_OFFSET_SLOTS) - Math.floor(EXIT_OFFSET_SLOTS / 2);
  const exitOffset = slot * EXIT_OFFSET_STEP_MM;

  const yA = rectA.y + rectA.height / 2 + exitOffset;
  const yB = rectB.y + rectB.height / 2 + exitOffset;
  const exitA = rectA.x + rectA.width;
  const exitB = rectB.x + rectB.width;

  const path = [
    `M ${exitA} ${yA}`,
    `L ${laneX} ${yA}`,
    `L ${laneX} ${yB}`,
    `L ${exitB} ${yB}`,
  ].join(" ");

  // Anker knapp unter der oberen Ecke statt auf der Zeilenmitte: die Mitte
  // zwischen zwei beliebigen Ports kann zufällig auf einer fremden
  // Gerätezeile landen. Die endgültige Position bekommt noch eine
  // Kollisionsvermeidung verpasst (siehe placeLabels in renderRackView).
  const labelY = Math.min(yA, yB) + 3;

  return {
    connection,
    path,
    labelY,
  };
}
