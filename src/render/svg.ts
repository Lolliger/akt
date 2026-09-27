const SVG_NS = "http://www.w3.org/2000/svg";

type Attrs = Record<string, string | number | undefined>;

/** Kleiner Helfer, um SVG-Elemente ohne Framework knapp zu erzeugen. */
export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (SVGElement | string)[] = [],
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    el.setAttribute(key, String(value));
  }
  for (const child of children) {
    el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

export function svgText(
  x: number,
  y: number,
  content: string,
  attrs: Attrs = {},
): SVGTextElement {
  return svgEl("text", { x, y, ...attrs }, [content]);
}
