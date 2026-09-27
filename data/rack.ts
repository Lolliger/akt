/**
 * Rack-Daten für das Technikrack.
 *
 * Diese Datei ist die "Wahrheit" über das reale Rack. Alles, was vor Ort
 * noch nicht geprüft/gemessen wurde, ist als Platzhalter markiert (Notiz-Feld
 * oder Kommentar) statt stillschweigend erfunden zu werden. Werte ergänzen,
 * sobald sie vor Ort erfasst sind – die App kommt mit unvollständigen
 * Angaben zurecht.
 *
 * Aktueller Stand: nur Vorderansicht + die in der Beschreibung explizit
 * genannten Verbindungen. Aula-Anschlüsse, Rückseiten-Details, KNX- und
 * DMX-Feinverkabelung folgen, sobald sie vor Ort erfasst sind.
 */
import type { BlankPanel, Connection, Device, Port, Rack } from "../src/model/types";
import connectionsData from "./connections.json";

/** Erzeugt eine Reihe durchnummerierter Ports (z.B. für Patchpanel/Switch). */
function portRow(
  deviceId: string,
  count: number,
  portKind: Port["portKind"],
  face: Port["face"],
  signalType?: Port["signalType"],
): Port[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      id: `${deviceId}.${String(n).padStart(2, "0")}`,
      holderId: deviceId,
      holderType: "device",
      label: String(n).padStart(2, "0"),
      face,
      portKind,
      signalType,
      order: n,
    };
  });
}

const netzverteilung: Device = {
  id: "power",
  kind: "device",
  name: "Netzverteilung",
  deviceType: "power",
  positionStartHU: 1,
  heightHU: 1,
  notes:
    "Anzahl/Anordnung der Steckdosen und genaue Seite (vorne/hinten) noch vor Ort zu prüfen.",
  ports: portRow("power", 6, "schuko", "front", "strom"),
};

const patchpanel1: Device = {
  id: "pp1",
  kind: "device",
  name: "Patchpanel 1",
  deviceType: "patchpanel",
  positionStartHU: 2,
  heightHU: 1,
  notes:
    "Signaltyp je Port hängt von der jeweiligen Belegung ab und wird erst mit der Aula-Zuordnung bekannt.",
  ports: portRow("pp1", 24, "rj45", "front"),
};

const patchpanel2: Device = {
  id: "pp2",
  kind: "device",
  name: "Patchpanel 2",
  deviceType: "patchpanel",
  positionStartHU: 3,
  heightHU: 1,
  notes:
    "Signaltyp je Port hängt von der jeweiligen Belegung ab und wird erst mit der Aula-Zuordnung bekannt.",
  ports: portRow("pp2", 24, "rj45", "front"),
};

const swTon: Device = {
  id: "sw-ton",
  kind: "device",
  name: "Ton-Netzwerkswitch",
  deviceType: "switch",
  positionStartHU: 4,
  heightHU: 1,
  properties: { managed: "false" },
  notes: "Exaktes Modell und Portanzahl noch zu prüfen, hier 8 Ports angenommen.",
  ports: portRow("sw-ton", 8, "rj45", "front", "ton-netzwerk"),
};

const swLicht: Device = {
  id: "sw-licht",
  kind: "device",
  name: "Licht-Netzwerkswitch",
  deviceType: "switch",
  positionStartHU: 5,
  heightHU: 1,
  properties: { managed: "false" },
  notes: "Exaktes Modell und Portanzahl noch zu prüfen, hier 8 Ports angenommen.",
  ports: portRow("sw-licht", 8, "rj45", "front", "licht-netzwerk"),
};

const swVideo: Device = {
  id: "sw-video",
  kind: "device",
  name: "Video-Netzwerkswitch",
  deviceType: "switch",
  positionStartHU: 6,
  heightHU: 1,
  properties: { managed: "true" },
  notes:
    "Managed – Grund dafür aktuell nicht bekannt, hier nur als Eigenschaft hinterlegt. Portanzahl (hier 8) noch zu prüfen.",
  ports: portRow("sw-video", 8, "rj45", "front", "video-netzwerk"),
};

const blende1: BlankPanel = {
  id: "blende-1",
  kind: "blank",
  label: "Blende",
  positionStartHU: 7,
  heightHU: 1,
};

const dmxRecorder: Device = {
  id: "dmx-recorder",
  kind: "device",
  name: "DMX Recorder",
  deviceType: "dmx-recorder",
  positionStartHU: 8,
  heightHU: 1,
  notes: "Unabhängig vom normalen Netzwerkpfad, siehe dmx-node-2.",
  ports: [
    {
      id: "dmx-recorder.out",
      holderId: "dmx-recorder",
      holderType: "device",
      label: "DMX Out",
      face: "rear",
      portKind: "dmx5",
      signalType: "dmx",
      order: 1,
    },
  ],
};

const dmxExtender: Device = {
  id: "dmx-extender",
  kind: "device",
  name: "DMX Extender/Repeater",
  deviceType: "dmx-extender",
  positionStartHU: 9,
  heightHU: 1,
  ports: [
    {
      id: "dmx-extender.in",
      holderId: "dmx-extender",
      holderType: "device",
      label: "DMX In",
      face: "rear",
      portKind: "dmx5",
      signalType: "dmx",
      order: 1,
    },
    {
      id: "dmx-extender.out",
      holderId: "dmx-extender",
      holderType: "device",
      label: "DMX Out",
      face: "rear",
      portKind: "dmx5",
      signalType: "dmx",
      order: 2,
    },
  ],
};

const knx: Device = {
  id: "knx-1",
  kind: "device",
  name: "KNX-Komponenten",
  deviceType: "knx",
  positionStartHU: 10,
  heightHU: 1,
  notes: "Funktion und Verkabelung noch nicht vollständig bekannt.",
  ports: [
    {
      id: "knx-1.bus",
      holderId: "knx-1",
      holderType: "device",
      label: "KNX Bus",
      face: "rear",
      portKind: "knx-bus",
      signalType: "knx",
      order: 1,
      description: "Noch zu erfassen.",
    },
  ],
};

const dmxNode1: Device = {
  id: "dmx-node-1",
  kind: "device",
  name: "DMX/Netzwerk-Node",
  manufacturer: "Showtec",
  model: "NET-2 Install",
  deviceType: "dmx-node",
  positionStartHU: 11,
  heightHU: 1,
  notes:
    "Licht-Netzwerk → DMX/Netzwerk-Node → DMX (Aula-Lichtanlage). Ports laut Showtec NET-2 Install Datenblatt: 1x RJ45 Netzwerk, 2x Phoenix-DMX (je bidirektional konfigurierbar).",
  ports: [
    {
      id: "dmx-node-1.net",
      holderId: "dmx-node-1",
      holderType: "device",
      label: "Netzwerk",
      face: "rear",
      portKind: "rj45",
      signalType: "licht-netzwerk",
      order: 1,
    },
    {
      id: "dmx-node-1.dmx-1",
      holderId: "dmx-node-1",
      holderType: "device",
      label: "DMX 1",
      face: "rear",
      portKind: "phoenix",
      signalType: "dmx",
      order: 2,
      description: "Phoenix-Klemme, In/Out per Konfiguration.",
    },
    {
      id: "dmx-node-1.dmx-2",
      holderId: "dmx-node-1",
      holderType: "device",
      label: "DMX 2",
      face: "rear",
      portKind: "phoenix",
      signalType: "dmx",
      order: 3,
      description: "Phoenix-Klemme, In/Out per Konfiguration.",
    },
  ],
};

// Zweiter Node, über den laut Beschreibung der Recorder-Output ins Netzwerk
// geht. Liegt laut Vor-Ort-Angabe lose hinten im Rack (kein fester Rack-
// Einbau) - Position hier nur als Platzhalter einsortiert.
const dmxNode2: Device = {
  id: "dmx-node-2",
  kind: "device",
  name: "DMX/Netzwerk-Node (Recorder-Ausgang)",
  manufacturer: "Showtec",
  model: "NET-2/5 Pocket",
  deviceType: "dmx-node",
  positionStartHU: 12,
  heightHU: 1,
  notes:
    "Liegt lose hinten im Rack, keine feste HE-Position - hier nur als Platzhalter einsortiert. Ports laut Showtec NET-2/5 Pocket Datenblatt: 1x RJ45 Netzwerk, 2x 5-Pol-XLR-DMX (je bidirektional konfigurierbar).",
  ports: [
    {
      id: "dmx-node-2.net",
      holderId: "dmx-node-2",
      holderType: "device",
      label: "Netzwerk",
      face: "rear",
      portKind: "rj45",
      signalType: "licht-netzwerk",
      order: 1,
      description: "Welcher Switch-Port dahinter liegt, ist noch zu klären.",
    },
    {
      id: "dmx-node-2.dmx-1",
      holderId: "dmx-node-2",
      holderType: "device",
      label: "DMX 1",
      face: "rear",
      portKind: "dmx5",
      signalType: "dmx",
      order: 2,
      description: "5-Pol-XLR, bidirektional konfigurierbar - hier als Eingang vom DMX Recorder genutzt.",
    },
    {
      id: "dmx-node-2.dmx-2",
      holderId: "dmx-node-2",
      holderType: "device",
      label: "DMX 2",
      face: "rear",
      portKind: "dmx5",
      signalType: "dmx",
      order: 3,
      description: "5-Pol-XLR, bidirektional konfigurierbar - Nutzung noch offen.",
    },
  ],
};

const blende2: BlankPanel = {
  id: "blende-2",
  kind: "blank",
  label: "Blende",
  positionStartHU: 13,
  heightHU: 1,
};

const ahm16: Device = {
  id: "ahm16",
  kind: "device",
  name: "AHM-16",
  manufacturer: "Allen & Heath",
  model: "AHM-16",
  deviceType: "mixer",
  positionStartHU: 14,
  heightHU: 1,
  properties: { "option-karte": "Dante 64x64" },
  notes:
    "Grundgerät-Ports laut A&H-Datenblatt/Getting-Started-Guide gesichert. Dante-Karten-Portmuster (Primary/Secondary/Control Network, 3x EtherCON) von anderen A&H-Dante-Karten übernommen - für dieses konkrete Karten-Modell noch vor Ort zu bestätigen. Welche Netzwerke an Control-Network/DX-Port hängen, ist ebenfalls noch offen.",
  ports: [
    {
      id: "ahm16.dante-primary",
      holderId: "ahm16",
      holderType: "device",
      label: "Dante Primary",
      face: "rear",
      portKind: "rj45",
      signalType: "ton-netzwerk",
      order: 1,
      description: "EtherCON (Dante 64x64-Karte). Verbindung zum Ton-Netzwerkswitch angenommen, vor Ort zu bestätigen.",
    },
    {
      id: "ahm16.dante-secondary",
      holderId: "ahm16",
      holderType: "device",
      label: "Dante Secondary",
      face: "rear",
      portKind: "rj45",
      signalType: "unbekannt",
      order: 2,
      description: "EtherCON, Redundanz-Port der Dante-Karte, vermutlich ungenutzt.",
    },
    {
      id: "ahm16.dante-ctrl",
      holderId: "ahm16",
      holderType: "device",
      label: "Dante Control Network",
      face: "rear",
      portKind: "rj45",
      signalType: "unbekannt",
      order: 3,
      description: "EtherCON, für Dante Controller Software.",
    },
    {
      id: "ahm16.control-net",
      holderId: "ahm16",
      holderType: "device",
      label: "Control Network",
      face: "rear",
      portKind: "rj45",
      signalType: "unbekannt",
      order: 4,
      description: "RJ45 am Grundgerät, TCP/IP-Steuerung (System Manager) - eigenes Netzwerk oder gemeinsam mit Ton-Netzwerk? Noch zu prüfen.",
    },
    {
      id: "ahm16.dx",
      holderId: "ahm16",
      holderType: "device",
      label: "DX Expander",
      face: "rear",
      portKind: "rj45",
      signalType: "unbekannt",
      order: 5,
      description: "Für DX-Expander-Einheiten, aktuell vermutlich ungenutzt.",
    },
    {
      id: "ahm16.gpio",
      holderId: "ahm16",
      holderType: "device",
      label: "GPIO",
      face: "rear",
      portKind: "phoenix",
      signalType: "unbekannt",
      order: 6,
      description: "2x Eingang (gegen Masse), 2x Relaisausgang, 10V DC - aktuell vermutlich ungenutzt.",
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `ahm16.in-${i + 1}`,
      holderId: "ahm16",
      holderType: "device" as const,
      label: `In ${i + 1}`,
      face: "rear" as const,
      portKind: "phoenix" as const,
      signalType: "audio-analog" as const,
      order: 7 + i,
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `ahm16.out-${i + 1}`,
      holderId: "ahm16",
      holderType: "device" as const,
      label: `Out ${i + 1}`,
      face: "rear" as const,
      portKind: "phoenix" as const,
      signalType: "audio-analog" as const,
      order: 15 + i,
    })),
  ],
};

const induktionsschleife: Device = {
  id: "induction-1",
  kind: "device",
  name: "Induktionsschleifenanlage",
  manufacturer: "Univox",
  model: "SLS-1",
  deviceType: "induction-loop",
  positionStartHU: 15,
  heightHU: 2,
  notes:
    "Ports laut Univox SLS-1 Installationsanleitung. Genaue Steckertypen für Kopfhörer-/Monitorausgang und die tatsächlich genutzte Verkabelung noch vor Ort zu prüfen.",
  ports: [
    {
      id: "induction-1.in1",
      holderId: "induction-1",
      holderType: "device",
      label: "Input 1",
      face: "rear",
      portKind: "phoenix",
      signalType: "audio-analog",
      order: 1,
      description: "Balanciert Mic/Line, Phantomspeisung + Hochpassfilter.",
    },
    {
      id: "induction-1.in2",
      holderId: "induction-1",
      holderType: "device",
      label: "Input 2",
      face: "rear",
      portKind: "phoenix",
      signalType: "audio-analog",
      order: 2,
      description: "Balanciert Line / 100V-Lautsprecherleitung, umschaltbar.",
    },
    {
      id: "induction-1.in3",
      holderId: "induction-1",
      holderType: "device",
      label: "Input 3",
      face: "rear",
      portKind: "phoenix",
      signalType: "audio-analog",
      order: 3,
      description: "Phoenix/RCA mit Vorrangschaltung (Priority).",
    },
    {
      id: "induction-1.loop-out",
      holderId: "induction-1",
      holderType: "device",
      label: "Loop-Ausgang",
      face: "rear",
      portKind: "phoenix",
      signalType: "audio-analog",
      order: 4,
      description: "Balanciert (+/-) zur Induktionsschleifen-Antenne.",
    },
    {
      id: "induction-1.contact1",
      holderId: "induction-1",
      holderType: "device",
      label: "Kontakt 1",
      face: "rear",
      portKind: "phoenix",
      signalType: "unbekannt",
      order: 5,
      description: "Schaltkontakt für externe Status-LED.",
    },
    {
      id: "induction-1.contact2",
      holderId: "induction-1",
      holderType: "device",
      label: "Kontakt 2",
      face: "rear",
      portKind: "phoenix",
      signalType: "unbekannt",
      order: 6,
      description: "Schaltkontakt für externe Status-LED.",
    },
    {
      id: "induction-1.headphone",
      holderId: "induction-1",
      holderType: "device",
      label: "Kopfhörer",
      face: "rear",
      portKind: "sonstige",
      signalType: "audio-analog",
      order: 7,
      description: "Kopfhörerbuchse, genauer Steckertyp noch zu prüfen.",
    },
    {
      id: "induction-1.monitor",
      holderId: "induction-1",
      holderType: "device",
      label: "Monitor-Lautsprecher",
      face: "rear",
      portKind: "sonstige",
      signalType: "audio-analog",
      order: 8,
      description: "Anschluss für Monitorlautsprecher, genauer Steckertyp noch zu prüfen.",
    },
  ],
};

export const rack: Rack = {
  id: "rack-1",
  name: "Technikrack",
  // Vorläufig aus den Einzelhöhen der Geräte summiert (siehe Geräte oben).
  // Noch nicht vor Ort vermessen/bestätigt.
  heightUnits: 16,
  widthMm: 483,
  notes:
    "Gesamthöhe vorläufig aus Geräte-Einzelhöhen berechnet, noch nicht vor Ort vermessen.",
  items: [
    netzverteilung,
    patchpanel1,
    patchpanel2,
    swTon,
    swLicht,
    swVideo,
    blende1,
    dmxRecorder,
    dmxExtender,
    knx,
    dmxNode1,
    dmxNode2,
    blende2,
    ahm16,
    induktionsschleife,
  ],
  // Aula-Anschlüsse sind noch nicht erfasst (Nummerierung folgt vor Ort).
  externalEndpoints: [],
  // Verbindungen liegen in einer eigenen JSON-Datei (nicht in dieser
  // TS-Datei), damit sie über das Formular im Browser gepflegt werden können,
  // ohne Code zu bearbeiten. Siehe connections.json + vite.config.ts.
  connections: connectionsData as Connection[],
};
