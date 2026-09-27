import type { SignalType } from "../model/types";

/**
 * Visueller Stil: neutral/schwarz-weiß mit dezenten Akzentfarben je
 * Netzwerk/Signaltyp. Farbe wird bewusst sparsam eingesetzt (dünne Kontur,
 * kein Flächenfüllen), damit die Zeichnung wie technische Dokumentation und
 * nicht wie eine bunte Software-Grafik wirkt.
 */
export const COLOR = {
  ink: "#1a1a1a",
  inkSoft: "#4a4a4a",
  paper: "#ffffff",
  panelFill: "#f4f4f2",
  railFill: "#e8e8e6",
  blankHatch: "#c9c9c6",
  portFill: "#ffffff",
  portFillUnknown: "#f0f0ee",
};

export const PORT_KIND_LABEL: Record<string, string> = {
  rj45: "RJ45",
  xlr: "XLR",
  dmx5: "DMX5",
  "terminal-block": "Klemme",
  "knx-bus": "KNX",
  phoenix: "Phoenix",
  schuko: "Schuko",
  sonstige: "—",
};

export const SIGNAL_ACCENT: Record<SignalType, string> = {
  "ton-netzwerk": "#9a5b2e",
  "licht-netzwerk": "#a9821f",
  "video-netzwerk": "#345971",
  "audio-analog": "#3c6e63",
  dmx: "#6a4c7d",
  knx: "#4c7a4c",
  strom: "#8a3a3a",
  unbekannt: "#8a8a86",
};

export function accentFor(signalType: string | undefined): string {
  if (!signalType) return SIGNAL_ACCENT["unbekannt"];
  return SIGNAL_ACCENT[signalType as SignalType] ?? SIGNAL_ACCENT["unbekannt"];
}

/** Schrift- und Strichstärken, alle Angaben in mm (Zeichnung ist mm-maßstäblich). */
export const TYPE = {
  fontFamily: "'Neue Haas Grotesk', 'Helvetica Neue', Arial, sans-serif",
  deviceName: 3.1,
  deviceMeta: 2.1,
  portLabel: 2.0,
  portKind: 1.5,
  ruler: 2.4,
  title: 5,
  connectionLabel: 1.9,
};

export const STROKE = {
  hairline: 0.2,
  regular: 0.35,
  frame: 0.6,
  connection: 0.4,
};
