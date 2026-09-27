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
      face: "front",
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
      face: "front",
      portKind: "dmx5",
      signalType: "dmx",
      order: 1,
    },
    {
      id: "dmx-extender.out",
      holderId: "dmx-extender",
      holderType: "device",
      label: "DMX Out",
      face: "front",
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
      face: "front",
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
  deviceType: "dmx-node",
  positionStartHU: 11,
  heightHU: 1,
  notes: "Licht-Netzwerk → DMX/Netzwerk-Node → DMX.",
  ports: [
    {
      id: "dmx-node-1.net",
      holderId: "dmx-node-1",
      holderType: "device",
      label: "Netzwerk",
      face: "front",
      portKind: "rj45",
      signalType: "licht-netzwerk",
      order: 1,
    },
    {
      id: "dmx-node-1.dmx-out",
      holderId: "dmx-node-1",
      holderType: "device",
      label: "DMX Out",
      face: "front",
      portKind: "dmx5",
      signalType: "dmx",
      order: 2,
    },
  ],
};

// Zweiter Node, über den laut Beschreibung der Recorder-Output ins Netzwerk
// geht. Position "hinten im Rack" ist noch nicht auf ein konkretes HE
// festgelegt - vorläufig direkt nach dem ersten Node einsortiert.
const dmxNode2: Device = {
  id: "dmx-node-2",
  kind: "device",
  name: "DMX/Netzwerk-Node (Recorder-Ausgang)",
  deviceType: "dmx-node",
  positionStartHU: 12,
  heightHU: 1,
  notes:
    "Laut Beschreibung 'hinten im Rack' - exakte Position und Verkabelung ins Netzwerk noch zu klären.",
  ports: [
    {
      id: "dmx-node-2.dmx-in",
      holderId: "dmx-node-2",
      holderType: "device",
      label: "DMX In",
      face: "rear",
      portKind: "dmx5",
      signalType: "dmx",
      order: 1,
    },
    {
      id: "dmx-node-2.net",
      holderId: "dmx-node-2",
      holderType: "device",
      label: "Netzwerk",
      face: "rear",
      portKind: "rj45",
      signalType: "licht-netzwerk",
      order: 2,
      description: "Welcher Switch-Port dahinter liegt, ist noch zu klären.",
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
  notes: "Analoge Audioverbindungen sind Platzhalter und noch zu erfassen.",
  ports: [
    {
      id: "ahm16.net",
      holderId: "ahm16",
      holderType: "device",
      label: "Netzwerk",
      face: "rear",
      portKind: "rj45",
      signalType: "ton-netzwerk",
      order: 1,
    },
    {
      id: "ahm16.audio-a",
      holderId: "ahm16",
      holderType: "device",
      label: "Audio A",
      face: "rear",
      portKind: "xlr",
      signalType: "unbekannt",
      order: 2,
      description: "Analoge Audioverbindung - Ziel/Quelle noch zu dokumentieren.",
    },
    {
      id: "ahm16.audio-b",
      holderId: "ahm16",
      holderType: "device",
      label: "Audio B",
      face: "rear",
      portKind: "xlr",
      signalType: "unbekannt",
      order: 3,
      description: "Analoge Audioverbindung - Ziel/Quelle noch zu dokumentieren.",
    },
  ],
};

const induktionsschleife: Device = {
  id: "induction-1",
  kind: "device",
  name: "Induktionsschleifenanlage",
  deviceType: "induction-loop",
  positionStartHU: 15,
  heightHU: 2,
  notes: "Anschlüsse noch nicht erfasst.",
  ports: [
    {
      id: "induction-1.in",
      holderId: "induction-1",
      holderType: "device",
      label: "Eingang",
      face: "rear",
      portKind: "terminal-block",
      signalType: "unbekannt",
      order: 1,
      description: "Verkabelung noch zu erfassen.",
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
