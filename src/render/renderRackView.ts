import { HU_HEIGHT_MM } from "../model/constants";
import { isDevice, isBlankPanel } from "../model/types";
import type { Rack, Face, Device } from "../model/types";
import { computeRackViewLayout } from "../layout/computeRackView";
import { RAIL_WIDTH_MM } from "../layout/constants";
import { routeConnections } from "./routeConnections";
import { svgEl, svgText } from "./svg";
import { COLOR, STROKE, TYPE, accentFor } from "./style";

const TOP_MARGIN_MM = 14;
const BOTTOM_MARGIN_MM = 8;
const RIGHT_MARGIN_MM = 10;
const LANE_GAP_MM = 8;

const DEVICE_TYPE_LABEL: Record<Device["deviceType"], string> = {
  power: "Stromversorgung",
  patchpanel: "Patchpanel",
  switch: "Netzwerk-Switch",
  mixer: "Audio-Mischer/Prozessor",
  "dmx-node": "DMX/Netzwerk-Node",
  "dmx-recorder": "DMX Recorder",
  "dmx-extender": "DMX Extender/Repeater",
  knx: "KNX",
  "induction-loop": "Induktionsschleifenanlage",
  sonstige: "",
};

/** Rendert eine komplette Rack-Ansicht (Vorder- oder Rückseite) als eigenständiges SVG. */
export function renderRackView(rack: Rack, face: Face): SVGSVGElement {
  const layout = computeRackViewLayout(rack, face);
  const laneStartX = layout.frame.x + layout.frame.width + LANE_GAP_MM;
  const routing = routeConnections(rack, layout, laneStartX);

  // Stub-Beschriftungen stehen hinter allen Kabelspuren, damit sich Text und
  // Leitungen nicht überlagern; dafür braucht die Zeichenfläche genug Breite.
  const stubLabelX = routing.laneExtentX + 4;
  const maxStubLabelWidth = routing.stubs.reduce((max, stub) => {
    const text = `${stub.connection.displayId} → ${stub.otherEndLabel}`;
    return Math.max(max, estimateTextWidth(text, TYPE.connectionLabel));
  }, 0);

  const canvasWidth =
    Math.max(routing.laneExtentX, stubLabelX + maxStubLabelWidth) + RIGHT_MARGIN_MM;
  const canvasHeight = layout.canvasHeightMm + TOP_MARGIN_MM + BOTTOM_MARGIN_MM;
  const originY = TOP_MARGIN_MM;

  const svg = svgEl("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: `${canvasWidth}mm`,
    height: `${canvasHeight}mm`,
    viewBox: `0 0 ${canvasWidth} ${canvasHeight}`,
    "font-family": TYPE.fontFamily,
  });

  svg.appendChild(
    svgEl("rect", {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      fill: COLOR.paper,
    }),
  );

  svg.appendChild(defs());

  const title = face === "front" ? "Vorderansicht" : "Rückansicht";
  svg.appendChild(
    svgText(layout.frame.x, TOP_MARGIN_MM - 5, `${rack.name} — ${title}`, {
      "font-size": TYPE.title,
      "font-weight": 600,
      fill: COLOR.ink,
    }),
  );

  const g = svgEl("g", { transform: `translate(0, ${originY})` });
  svg.appendChild(g);

  g.appendChild(rackFrame(rack, layout.frame));
  g.appendChild(heRuler(rack, layout.frame));

  for (const itemLayout of layout.items) {
    if (isBlankPanel(itemLayout.item)) {
      g.appendChild(blankPanel(itemLayout.rect, itemLayout.item.label ?? "Blende"));
      continue;
    }
    if (isDevice(itemLayout.item)) {
      g.appendChild(deviceGroup(itemLayout.item, itemLayout.rect));
      for (const portLayout of itemLayout.ports) {
        g.appendChild(portGroup(portLayout));
      }
    }
  }

  const stubMarkerX = layout.frame.x + layout.frame.width + 3;
  for (const routedConnection of routing.routed) {
    g.appendChild(connectionLine(routedConnection));
  }
  for (const stub of routing.stubs) {
    g.appendChild(connectionStub(stub, stubMarkerX, stubLabelX));
  }

  return svg;
}

function defs(): SVGDefsElement {
  const pattern = svgEl(
    "pattern",
    {
      id: "blank-hatch",
      patternUnits: "userSpaceOnUse",
      width: 4,
      height: 4,
      patternTransform: "rotate(45)",
    },
    [
      svgEl("rect", { width: 4, height: 4, fill: COLOR.panelFill }),
      svgEl("line", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 4,
        stroke: COLOR.blankHatch,
        "stroke-width": STROKE.hairline,
      }),
    ],
  );
  return svgEl("defs", {}, [pattern]);
}

function rackFrame(rack: Rack, frame: { x: number; y: number; width: number; height: number }) {
  const g = svgEl("g");

  g.appendChild(
    svgEl("rect", {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      fill: COLOR.paper,
      stroke: COLOR.ink,
      "stroke-width": STROKE.frame,
    }),
  );

  // Befestigungsschienen links/rechts inkl. stilisierter Schraubenlöcher
  // (Lochabstand vereinfacht: ein Loch pro HE, nicht exakte EIA-310-Teilung).
  for (const railX of [frame.x, frame.x + frame.width - RAIL_WIDTH_MM]) {
    g.appendChild(
      svgEl("rect", {
        x: railX,
        y: frame.y,
        width: RAIL_WIDTH_MM,
        height: frame.height,
        fill: COLOR.railFill,
        stroke: COLOR.ink,
        "stroke-width": STROKE.hairline,
      }),
    );
    for (let hu = 0; hu < rack.heightUnits; hu++) {
      const rowTop = frame.y + hu * HU_HEIGHT_MM;
      // Zwei Löcher nahe Ober-/Unterkante statt mittig, damit sie nicht mit
      // horizontal geführten Verbindungslinien auf halber Zeilenhöhe kollidieren.
      for (const cy of [rowTop + 6, rowTop + HU_HEIGHT_MM - 6]) {
        g.appendChild(
          svgEl("circle", {
            cx: railX + RAIL_WIDTH_MM / 2,
            cy,
            r: 1.1,
            fill: COLOR.paper,
            stroke: COLOR.inkSoft,
            "stroke-width": STROKE.hairline,
          }),
        );
      }
    }
  }

  return g;
}

function heRuler(rack: Rack, frame: { x: number; y: number; width: number; height: number }) {
  const g = svgEl("g");
  for (let hu = 0; hu < rack.heightUnits; hu++) {
    const rowTop = frame.y + hu * HU_HEIGHT_MM;
    g.appendChild(
      svgEl("line", {
        x1: frame.x - 3,
        y1: rowTop,
        x2: frame.x,
        y2: rowTop,
        stroke: COLOR.inkSoft,
        "stroke-width": STROKE.hairline,
      }),
    );
    g.appendChild(
      svgText(frame.x - 4, rowTop + HU_HEIGHT_MM / 2 + TYPE.ruler / 3, String(hu + 1), {
        "font-size": TYPE.ruler,
        fill: COLOR.inkSoft,
        "text-anchor": "end",
      }),
    );
  }
  g.appendChild(
    svgEl("line", {
      x1: frame.x - 3,
      y1: frame.y + frame.height,
      x2: frame.x,
      y2: frame.y + frame.height,
      stroke: COLOR.inkSoft,
      "stroke-width": STROKE.hairline,
    }),
  );
  return g;
}

function blankPanel(
  rect: { x: number; y: number; width: number; height: number },
  label: string,
) {
  const g = svgEl("g");
  g.appendChild(
    svgEl("rect", {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: "url(#blank-hatch)",
      stroke: COLOR.ink,
      "stroke-width": STROKE.regular,
    }),
  );
  g.appendChild(
    svgText(rect.x + rect.width / 2, rect.y + rect.height / 2 + TYPE.deviceMeta / 3, label, {
      "font-size": TYPE.deviceMeta,
      fill: COLOR.inkSoft,
      "text-anchor": "middle",
      "font-style": "italic",
    }),
  );
  return g;
}

function deviceGroup(device: Device, rect: { x: number; y: number; width: number; height: number }) {
  const g = svgEl("g");
  g.appendChild(
    svgEl("rect", {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: COLOR.panelFill,
      stroke: COLOR.ink,
      "stroke-width": STROKE.regular,
    }),
  );

  g.appendChild(
    svgText(rect.x + 3, rect.y + TYPE.deviceName + 1.5, device.name, {
      "font-size": TYPE.deviceName,
      "font-weight": 600,
      fill: COLOR.ink,
    }),
  );

  const metaParts = [
    device.manufacturer && device.model ? `${device.manufacturer} ${device.model}` : undefined,
    DEVICE_TYPE_LABEL[device.deviceType] || undefined,
    device.properties?.managed === "true" ? "managed" : undefined,
  ].filter(Boolean);

  if (metaParts.length > 0) {
    g.appendChild(
      svgText(
        rect.x + 3,
        rect.y + TYPE.deviceName + TYPE.deviceMeta + 3,
        metaParts.join(" · "),
        {
          "font-size": TYPE.deviceMeta,
          fill: COLOR.inkSoft,
        },
      ),
    );
  }

  return g;
}

function portGroup(portLayout: {
  port: { label: string; signalType?: string };
  rect: { x: number; y: number; width: number; height: number };
}) {
  const { port, rect } = portLayout;
  const g = svgEl("g");
  const accentHeight = 1.1;

  g.appendChild(
    svgEl("rect", {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: COLOR.portFill,
      stroke: COLOR.ink,
      "stroke-width": STROKE.hairline,
    }),
  );
  g.appendChild(
    svgEl("rect", {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: accentHeight,
      fill: accentFor(port.signalType),
    }),
  );
  g.appendChild(
    svgText(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2 + TYPE.portLabel / 3 + accentHeight / 2,
      port.label,
      {
        "font-size": TYPE.portLabel,
        fill: COLOR.ink,
        "text-anchor": "middle",
      },
    ),
  );
  return g;
}

function connectionLine(routedConnection: {
  connection: { displayId: string; status: string };
  path: string;
  labelPos: { x: number; y: number };
}) {
  const { connection, path, labelPos } = routedConnection;
  const g = svgEl("g");
  g.appendChild(
    svgEl("path", {
      d: path,
      fill: "none",
      stroke: COLOR.ink,
      "stroke-width": STROKE.connection,
      "stroke-dasharray": connection.status === "bestaetigt" ? undefined : "2,1.4",
    }),
  );
  // Label neben statt auf der Linie platzieren, damit es lesbar bleibt.
  g.appendChild(
    svgEl(
      "text",
      {
        x: labelPos.x + 1.4,
        y: labelPos.y + TYPE.connectionLabel / 3,
        "font-size": TYPE.connectionLabel,
        fill: COLOR.inkSoft,
      },
      [connection.displayId],
    ),
  );
  return g;
}

/**
 * Kurzer Stich für Verbindungen, deren Gegenstelle in dieser Ansicht nicht
 * sichtbar ist (z.B. Rückseiten-Port). Der Marker sitzt direkt am Rack-Rand,
 * die eigentliche Beschriftung steht separat hinter allen Kabelspuren, damit
 * sich Text und Leitungen nicht überlagern.
 */
function connectionStub(
  stub: {
    connection: { displayId: string; status: string };
    rect: { x: number; y: number; width: number; height: number };
    otherEndLabel: string;
  },
  markerX: number,
  labelX: number,
) {
  const { connection, rect, otherEndLabel } = stub;
  const g = svgEl("g");
  const startX = rect.x + rect.width;
  const y = rect.y + rect.height / 2;
  const endX = Math.max(markerX, startX + 3);

  g.appendChild(
    svgEl("line", {
      x1: startX,
      y1: y,
      x2: endX,
      y2: y,
      stroke: COLOR.inkSoft,
      "stroke-width": STROKE.connection,
      "stroke-dasharray": connection.status === "bestaetigt" ? undefined : "2,1.4",
    }),
  );
  g.appendChild(
    svgEl("circle", { cx: endX, cy: y, r: 0.6, fill: COLOR.inkSoft }),
  );
  g.appendChild(
    svgText(labelX, y + TYPE.connectionLabel / 3, `${connection.displayId} → ${otherEndLabel}`, {
      "font-size": TYPE.connectionLabel,
      fill: COLOR.inkSoft,
    }),
  );
  return g;
}

/** Grobe Breitenschätzung für Fließtext-Labels, um genug Platz vorzusehen. */
function estimateTextWidth(text: string, fontSizeMm: number): number {
  return text.length * fontSizeMm * 0.55;
}
