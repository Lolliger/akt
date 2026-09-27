import type { Device, ExternalEndpoint, Port, Rack } from "./types";
import { isDevice } from "./types";

/** Alle im HE-Raster montierten Geräte eines Racks (ohne Blenden, ohne lose Geräte). */
export function getDevices(rack: Rack): Device[] {
  return rack.items.filter(isDevice);
}

/** Alle Geräte, egal ob im Raster montiert oder lose - für Port-Suche/Formulare. */
export function getAllDevices(rack: Rack): Device[] {
  return [...getDevices(rack), ...rack.looseDevices];
}

/** Alle Ports im Rack (Geräte + externe Gegenstellen) indiziert nach Port-ID. */
export function buildPortIndex(rack: Rack): Map<string, Port> {
  const index = new Map<string, Port>();
  for (const device of getAllDevices(rack)) {
    for (const port of device.ports) index.set(port.id, port);
  }
  for (const endpoint of rack.externalEndpoints) {
    for (const port of endpoint.ports) index.set(port.id, port);
  }
  return index;
}

/** Findet das Gerät oder die externe Gegenstelle, zu der ein Port gehört. */
export function getPortHolder(
  rack: Rack,
  port: Port,
): Device | ExternalEndpoint | undefined {
  if (port.holderType === "device") {
    return getAllDevices(rack).find((d) => d.id === port.holderId);
  }
  return rack.externalEndpoints.find((e) => e.id === port.holderId);
}

/** Menschlich lesbarer Name für einen Port inkl. Holder, z.B. "SW-TON · Port 07". */
export function describePort(rack: Rack, port: Port): string {
  const holder = getPortHolder(rack, port);
  const holderName = holder?.name ?? port.holderId;
  return `${holderName} · ${port.label}`;
}

/**
 * Überschreibt Port-Labels mit vom Nutzer im Browser vergebenen Namen
 * (siehe data/portLabels.json + /api/port-labels), damit z.B. Patchpanel-
 * Ports statt "05" einen sprechenden Namen tragen können, ohne Code zu
 * bearbeiten. Verändert die Ports in place.
 */
export function applyPortLabelOverrides(rack: Rack, overrides: Record<string, string>): void {
  const index = buildPortIndex(rack);
  for (const [portId, label] of Object.entries(overrides)) {
    const port = index.get(portId);
    if (port) port.label = label;
  }
}

/** Alle Ports gruppiert nach Gerät/externer Gegenstelle, für Auswahllisten im UI. */
export function groupPortsByHolder(rack: Rack): { holderName: string; ports: Port[] }[] {
  const groups: { holderName: string; ports: Port[] }[] = [];
  for (const device of getAllDevices(rack)) {
    if (device.ports.length > 0) groups.push({ holderName: device.name, ports: device.ports });
  }
  for (const endpoint of rack.externalEndpoints) {
    if (endpoint.ports.length > 0) groups.push({ holderName: endpoint.name, ports: endpoint.ports });
  }
  return groups;
}
