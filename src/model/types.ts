/**
 * Datenmodell für die Rack-Dokumentation.
 *
 * Grundidee: Ein Rack besteht aus RackItems (Geräte oder Blenden), die jeweils
 * eine feste Position/Höhe im HE-Raster belegen. Geräte und externe Gegenstellen
 * (z.B. Aula-Anschlüsse) besitzen Ports; Connections verbinden zwei Ports.
 *
 * Felder dürfen bewusst fehlen (optional / "unbekannt"), weil die Verkabelung
 * schrittweise erfasst wird – die App muss mit unvollständigen Daten umgehen
 * können, statt sie als Fehler zu behandeln.
 */

export type Face = "front" | "rear";

export type DeviceType =
  | "power"
  | "patchpanel"
  | "switch"
  | "mixer"
  | "dmx-node"
  | "dmx-recorder"
  | "dmx-extender"
  | "knx"
  | "induction-loop"
  | "sonstige";

export type PortKind =
  | "rj45"
  | "xlr"
  | "dmx5"
  | "terminal-block"
  | "knx-bus"
  | "phoenix"
  | "schuko"
  | "sonstige";

export type SignalType =
  | "ton-netzwerk"
  | "licht-netzwerk"
  | "video-netzwerk"
  | "audio-analog"
  | "dmx"
  | "knx"
  | "strom"
  | "unbekannt";

export type CableType =
  | "cat6"
  | "xlr"
  | "dmx-cable"
  | "phoenix"
  | "unbekannt"
  | "sonstige";

export type ConnectionStatus = "bestaetigt" | "angenommen" | "unbekannt";

export type HolderType = "device" | "external";

/** Ein physischer Anschluss an einem Gerät oder einer externen Gegenstelle. */
export interface Port {
  id: string;
  holderId: string;
  holderType: HolderType;
  /** Beschriftung wie am Gerät aufgedruckt, z.B. "07" oder "LINE OUT L". */
  label: string;
  /** Nur relevant für Geräte-Ports; externe Gegenstellen haben keine Seite. */
  face?: Face;
  portKind: PortKind;
  /** Fehlt, solange der Signaltyp noch nicht geklärt ist. */
  signalType?: SignalType;
  /** Reihenfolge innerhalb der Port-Reihe, bestimmt die Anordnung im Layout. */
  order: number;
  description?: string;
}

interface RackItemBase {
  id: string;
  /** Position von oben gezählt, 1 = oberste HE. */
  positionStartHU: number;
  heightHU: number;
}

/** Ein Gerät im Rack. */
export interface Device extends RackItemBase {
  kind: "device";
  name: string;
  manufacturer?: string;
  model?: string;
  deviceType: DeviceType;
  /** Freie Zusatzeigenschaften, z.B. { managed: "true" }. */
  properties?: Record<string, string>;
  notes?: string;
  ports: Port[];
}

/** Eine Blende (freier HE-Platz ohne Gerät). */
export interface BlankPanel extends RackItemBase {
  kind: "blank";
  label?: string;
}

export type RackItem = Device | BlankPanel;

/** Eine externe Gegenstelle außerhalb des Racks, z.B. ein Aula-Anschluss. */
export interface ExternalEndpoint {
  id: string;
  name: string;
  category?: string;
  ports: Port[];
}

/** Eine Verbindung zwischen zwei konkreten Ports. */
export interface Connection {
  id: string;
  /** Kurzcode für die Zeichnung/Tabelle, z.B. "K014". */
  displayId: string;
  portAId: string;
  portBId: string;
  signalFlow?: "A->B" | "B->A" | "bidirektional";
  cableType?: CableType;
  /** Erfassungsstatus – zentral, weil viele Verbindungen noch unklar sind. */
  status: ConnectionStatus;
  description?: string;
}

export interface Rack {
  id: string;
  name: string;
  /** Gesamthöhe in HE. Aktuell noch nicht final vermessen. */
  heightUnits: number;
  widthMm: number;
  items: RackItem[];
  externalEndpoints: ExternalEndpoint[];
  connections: Connection[];
  notes?: string;
}

export function isDevice(item: RackItem): item is Device {
  return item.kind === "device";
}

export function isBlankPanel(item: RackItem): item is BlankPanel {
  return item.kind === "blank";
}
