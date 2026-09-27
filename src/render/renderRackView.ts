import { HU_HEIGHT_MM } from "../model/constants";
import { isDevice, isBlankPanel } from "../model/types";
import type { Rack, Face, Device, Port } from "../model/types";
import { computeRackViewLayout } from "../layout/computeRackView";
import { RAIL_WIDTH_MM } from "../layout/constants";
import type { Rect } from "../layout/geometry";
import { routeConnections } from "./routeConnections";
import { svgEl, svgText } from "./svg";
import { COLOR, PORT_KIND_LABEL, STROKE, TYPE, accentFor } from "./style";

const TOP_MARGIN_MM = 14;
const BOTTOM_MARGIN_MM = 8;
const RIGHT_MARGIN_MM = 10;
const LANE_GAP_MM = 8;
/** Mindestabstand zwischen zwei Beschriftungen in der gemeinsamen Label-Spalte. */
const MIN_LABEL_GAP_MM = 3.4;

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

interface Label {
  text: string;
  y: number;
}

/** Rendert eine komplette Rack-Ansicht (Vorder- oder Rückseite) als eigenständiges SVG. */
export function renderRackView(rack: Rack, face: Face): SVGSVGElement {
  const layout = computeRackViewLayout(rack, face);
  const laneStartX = layout.frame.x + layout.frame.width + LANE_GAP_MM;
  const routing = routeConnections(rack, layout, laneStartX);

  // Alle Beschriftungen (durchgehende Verbindungen + Stubs) landen in einer
  // gemeinsamen Spalte hinter allen Kabelspuren, statt direkt an der
  // jeweiligen Linie zu kleben - so kollidieren weder Text mit Linien noch
  // mehrere Labels untereinander (siehe placeLabels).
  const labelX = routing.laneExtentX + 4;
  const rawLabels: Label[] = [
    ...routing.routed.map((r) => ({ text: r.connection.displayId, y: r.labelY })),
    ...routing.stubs.map((s) => ({
      text: `${s.connection.displayId} → ${s.otherEndLabel}`,
      y: s.dot.y,
    })),
  ];
  const placedLabels = placeLabels(rawLabels);
  const maxLabelWidth = placedLabels.reduce(
    (max, l) => Math.max(max, estimateTextWidth(l.text, TYPE.connectionLabel)),
    0,
  );

  const canvasWidth = Math.max(routing.laneExtentX, labelX + maxLabelWidth) + RIGHT_MARGIN_MM;
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
    svgEl("rect", { x: 0, y: 0, width: canvasWidth, height: canvasHeight, fill: COLOR.paper }),
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
      g.appendChild(deviceGroup(itemLayout.item, itemLayout.rect, false));
      for (const portLayout of itemLayout.ports) {
        g.appendChild(portGroup(portLayout));
      }
    }
  }

  if (layout.looseItems.length > 0) {
    g.appendChild(
      svgText(
        layout.looseItems[0].rect.x,
        layout.looseItems[0].rect.y - 3,
        "Lose Geräte (nicht fest im Rack verbaut)",
        { "font-size": TYPE.deviceMeta, fill: COLOR.inkSoft, "font-style": "italic" },
      ),
    );
    for (const itemLayout of layout.looseItems) {
      if (isDevice(itemLayout.item)) {
        g.appendChild(deviceGroup(itemLayout.item, itemLayout.rect, true));
        for (const portLayout of itemLayout.ports) {
          g.appendChild(portGroup(portLayout));
        }
      }
    }
  }

  for (const routedConnection of routing.routed) {
    g.appendChild(connectionLine(routedConnection));
  }
  for (const stub of routing.stubs) {
    g.appendChild(connectionStub(stub));
  }
  for (const label of placedLabels) {
    g.appendChild(
      svgText(labelX, label.y + TYPE.connectionLabel / 3, label.text, {
        "font-size": TYPE.connectionLabel,
        fill: COLOR.inkSoft,
      }),
    );
  }

  return svg;
}

/**
 * Sortiert Labels nach ihrer natürlichen Höhe und schiebt jedes, das zu nah
 * am vorherigen liegt, so weit nach unten, bis der Mindestabstand
 * eingehalten ist. Verhindert, dass sich Beschriftungen unterschiedlicher
 * Verbindungen gegenseitig überlagern.
 */
function placeLabels(labels: Label[]): Label[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  let prevY = -Infinity;
  return sorted.map((label) => {
    const y = Math.max(label.y, prevY + MIN_LABEL_GAP_MM);
    prevY = y;
    return { text: label.text, y };
  });
}

function defs(): SVGDefsElement {
  const pattern = svgEl(
    "pattern",
    { id: "blank-hatch", patternUnits: "userSpaceOnUse", width: 4, height: 4, patternTransform: "rotate(45)" },
    [
      svgEl("rect", { width: 4, height: 4, fill: COLOR.panelFill }),
      svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 4, stroke: COLOR.blankHatch, "stroke-width": STROKE.hairline }),
    ],
  );
  return svgEl("defs", {}, [pattern]);
}

function rackFrame(rack: Rack, frame: Rect) {
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

function heRuler(rack: Rack, frame: Rect) {
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

function blankPanel(rect: Rect, label: string) {
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

function deviceGroup(device: Device, rect: Rect, dashed: boolean) {
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
      "stroke-dasharray": dashed ? "3,1.6" : undefined,
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
      svgText(rect.x + 3, rect.y + TYPE.deviceName + TYPE.deviceMeta + 3, metaParts.join(" · "), {
        "font-size": TYPE.deviceMeta,
        fill: COLOR.inkSoft,
      }),
    );
  }

  return g;
}

function portGroup(portLayout: { port: Port; rect: Rect }) {
  const { port, rect } = portLayout;
  const g = svgEl("g", { style: "cursor: pointer;", "data-port-id": port.id });
  g.appendChild(svgEl("title", {}, ["Doppelklick zum Umbenennen"]));
  g.addEventListener("dblclick", (event) => {
    event.stopPropagation();
    void editPortLabel(port);
  });
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
    svgEl("rect", { x: rect.x, y: rect.y, width: rect.width, height: accentHeight, fill: accentFor(port.signalType) }),
  );
  const availableTextWidth = rect.width - 1;
  g.appendChild(
    svgText(rect.x + rect.width / 2, rect.y + accentHeight + TYPE.portLabel + 0.6, port.label, {
      "font-size": fittedFontSize(port.label, availableTextWidth, TYPE.portLabel),
      fill: COLOR.ink,
      "text-anchor": "middle",
    }),
  );
  const kindText = PORT_KIND_LABEL[port.portKind] ?? port.portKind;
  g.appendChild(
    svgText(rect.x + rect.width / 2, rect.y + rect.height - 1.2, kindText, {
      "font-size": fittedFontSize(kindText, availableTextWidth, TYPE.portKind),
      fill: COLOR.inkSoft,
      "text-anchor": "middle",
    }),
  );
  return g;
}

/**
 * Fragt per Prompt eine neue Beschriftung ab und speichert sie über den
 * lokalen Dev-Endpunkt (/api/port-labels, siehe vite.config.ts) in
 * data/portLabels.json - damit z.B. Patchpanel-Ports statt "05" einen
 * sprechenden Namen bekommen können, ohne Code zu bearbeiten.
 */
async function editPortLabel(port: Port): Promise<void> {
  const next = window.prompt("Neue Beschriftung für diesen Port:", port.label);
  if (next === null) return; // abgebrochen
  const trimmed = next.trim();
  if (!trimmed || trimmed === port.label) return;

  try {
    const res = await fetch("/api/port-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portId: port.id, label: trimmed }),
    });
    if (!res.ok) throw new Error(`Server antwortete mit ${res.status}`);
    location.reload();
  } catch (err) {
    window.alert(`Fehler beim Speichern: ${String(err)}`);
  }
}

/**
 * Verkleinert die Schrift, wenn ein Label breiter als sein Port wäre, statt
 * in den Nachbar-Port hinein zu überlaufen. Nach unten begrenzt, damit der
 * Text nicht unleserlich klein wird.
 */
function fittedFontSize(text: string, maxWidthMm: number, baseFontSizeMm: number): number {
  const estimatedWidth = estimateTextWidth(text, baseFontSizeMm);
  if (estimatedWidth <= maxWidthMm) return baseFontSizeMm;
  const MIN_FONT_SIZE_MM = 1.3;
  return Math.max(MIN_FONT_SIZE_MM, (baseFontSizeMm * maxWidthMm) / estimatedWidth);
}

function connectionLine(routedConnection: { connection: { status: string }; path: string }) {
  const { connection, path } = routedConnection;
  return svgEl("path", {
    d: path,
    fill: "none",
    stroke: COLOR.ink,
    "stroke-width": STROKE.connection,
    "stroke-dasharray": connection.status === "bestaetigt" ? undefined : "2,1.4",
  });
}

/**
 * Kurzer Stich für Verbindungen, deren Gegenstelle in dieser Ansicht nicht
 * sichtbar ist (z.B. Rückseiten-Port). Nur der Marker (Pfad + Punkt) wird
 * hier gezeichnet - die Textbeschriftung läuft zentral über placeLabels.
 */
function connectionStub(stub: {
  connection: { status: string };
  path: string;
  dot: { x: number; y: number };
}) {
  const { connection, path, dot } = stub;
  const g = svgEl("g");

  g.appendChild(
    svgEl("path", {
      d: path,
      fill: "none",
      stroke: COLOR.inkSoft,
      "stroke-width": STROKE.connection,
      "stroke-dasharray": connection.status === "bestaetigt" ? undefined : "2,1.4",
    }),
  );
  g.appendChild(svgEl("circle", { cx: dot.x, cy: dot.y, r: 0.6, fill: COLOR.inkSoft }));
  return g;
}

/** Grobe Breitenschätzung für Fließtext-Labels, um genug Platz vorzusehen. */
function estimateTextWidth(text: string, fontSizeMm: number): number {
  return text.length * fontSizeMm * 0.55;
}
