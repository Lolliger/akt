import type { Port, Rack, RackItem } from "../model/types";
import type { Rect } from "./geometry";

export interface PortLayout {
  port: Port;
  rect: Rect;
}

export interface ItemLayout {
  item: RackItem;
  rect: Rect;
  /** Nur die Ports der jeweils dargestellten Seite (front/rear). */
  ports: PortLayout[];
}

export interface RackViewLayout {
  rack: Rack;
  face: "front" | "rear";
  /** Gesamtabmessungen der Zeichenfläche in mm, inkl. Rand für die HE-Beschriftung und lose Geräte. */
  canvasWidthMm: number;
  canvasHeightMm: number;
  /** Rahmen des eigentlichen 19"-Racks (ohne Beschriftungsrand). */
  frame: Rect;
  items: ItemLayout[];
  /** Geräte ohne feste HE-Position, unterhalb des Rack-Rahmens dargestellt. */
  looseItems: ItemLayout[];
}
