import { HU_HEIGHT_MM } from "../model/constants";
import { isDevice } from "../model/types";
import type { Device, Face, Port, Rack, RackItem } from "../model/types";
import {
  LOOSE_AREA_GAP_MM,
  LOOSE_DEVICE_GAP_MM,
  LOOSE_DEVICE_WIDTH_MM,
  PORT_GAP_MM,
  PORT_HEIGHT_MM,
  PORT_MAX_WIDTH_MM,
  PORT_MIN_WIDTH_MM,
  PORT_ROW_INSET_MM,
  RAIL_WIDTH_MM,
  RULER_WIDTH_MM,
} from "./constants";
import type { Rect } from "./geometry";
import type { ItemLayout, PortLayout, RackViewLayout } from "./types";

/**
 * Berechnet die Geometrie einer Rack-Ansicht (vorne oder hinten).
 * Y-Positionen ergeben sich direkt aus dem HE-Raster, X-Positionen der Ports
 * aus ihrer Reihenfolge innerhalb des Geräts – ein echtes Graph-Layout ist
 * nicht nötig, da alle Positionen physisch vorgegeben sind. Geräte, die sich
 * eine HE teilen (columnIndex/columnCount), bekommen einen entsprechenden
 * Ausschnitt der Rack-Breite. Lose Geräte ohne feste HE-Position werden
 * unterhalb des Rahmens in eigenen Boxen dargestellt.
 */
export function computeRackViewLayout(rack: Rack, face: Face): RackViewLayout {
  const frame: Rect = {
    x: RULER_WIDTH_MM,
    y: 0,
    width: rack.widthMm,
    height: rack.heightUnits * HU_HEIGHT_MM,
  };

  const innerX = frame.x + RAIL_WIDTH_MM;
  const innerWidth = frame.width - RAIL_WIDTH_MM * 2;

  const items = rack.items.map((item) =>
    computeItemLayout(item, face, innerX, innerWidth, frame.y),
  );

  let looseY = frame.y + frame.height + LOOSE_AREA_GAP_MM;
  const looseItems = rack.looseDevices.map((device) => {
    const layout = computeLooseItemLayout(device, face, innerX, looseY);
    looseY += HU_HEIGHT_MM + LOOSE_DEVICE_GAP_MM;
    return layout;
  });

  const canvasHeightMm =
    rack.looseDevices.length > 0 ? looseY - LOOSE_DEVICE_GAP_MM : frame.y + frame.height;

  return {
    rack,
    face,
    canvasWidthMm: frame.x + frame.width,
    canvasHeightMm,
    frame,
    items,
    looseItems,
  };
}

function computeItemLayout(
  item: RackItem,
  face: Face,
  innerX: number,
  innerWidth: number,
  frameY: number,
): ItemLayout {
  let x = innerX;
  let width = innerWidth;
  if (isDevice(item) && item.columnCount && item.columnCount > 1) {
    width = innerWidth / item.columnCount;
    x = innerX + (item.columnIndex ?? 0) * width;
  }

  const rect: Rect = {
    x,
    y: frameY + ((item.positionStartHU ?? 0) - 1) * HU_HEIGHT_MM,
    width,
    height: (item.heightHU ?? 1) * HU_HEIGHT_MM,
  };

  if (!isDevice(item)) {
    return { item, rect, ports: [] };
  }

  const relevantPorts = item.ports
    .filter((p) => (p.face ?? "front") === face)
    .sort((a, b) => a.order - b.order);

  return { item, rect, ports: layoutPortRow(relevantPorts, rect) };
}

function computeLooseItemLayout(
  device: Device,
  face: Face,
  x: number,
  y: number,
): ItemLayout {
  const rect: Rect = { x, y, width: LOOSE_DEVICE_WIDTH_MM, height: HU_HEIGHT_MM };

  const relevantPorts = device.ports
    .filter((p) => (p.face ?? "front") === face)
    .sort((a, b) => a.order - b.order);

  return { item: device, rect, ports: layoutPortRow(relevantPorts, rect) };
}

function layoutPortRow(ports: Port[], deviceRect: Rect): PortLayout[] {
  if (ports.length === 0) return [];

  const availableWidth = deviceRect.width - PORT_ROW_INSET_MM * 2;
  const rawWidth = availableWidth / ports.length - PORT_GAP_MM;
  const portWidth = Math.min(
    PORT_MAX_WIDTH_MM,
    Math.max(PORT_MIN_WIDTH_MM, rawWidth),
  );

  const startX = deviceRect.x + PORT_ROW_INSET_MM;
  const y = deviceRect.y + (deviceRect.height - PORT_HEIGHT_MM) / 2;

  return ports.map((port, i) => ({
    port,
    rect: {
      x: startX + i * (portWidth + PORT_GAP_MM),
      y,
      width: portWidth,
      height: PORT_HEIGHT_MM,
    },
  }));
}
