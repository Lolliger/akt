import type { Device, ExternalEndpoint, Port, Rack } from "./types";
import { isDevice } from "./types";

/** Alle Geräte eines Racks (ohne Blenden). */
export function getDevices(rack: Rack): Device[] {
  return rack.items.filter(isDevice);
}

/** Alle Ports im Rack (Geräte + externe Gegenstellen) indiziert nach Port-ID. */
export function buildPortIndex(rack: Rack): Map<string, Port> {
  const index = new Map<string, Port>();
  for (const item of rack.items) {
    if (isDevice(item)) {
      for (const port of item.ports) index.set(port.id, port);
    }
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
    return getDevices(rack).find((d) => d.id === port.holderId);
  }
  return rack.externalEndpoints.find((e) => e.id === port.holderId);
}

/** Menschlich lesbarer Name für einen Port inkl. Holder, z.B. "SW-TON · Port 07". */
export function describePort(rack: Rack, port: Port): string {
  const holder = getPortHolder(rack, port);
  const holderName = holder?.name ?? port.holderId;
  return `${holderName} · ${port.label}`;
}

/** Alle Ports gruppiert nach Gerät/externer Gegenstelle, für Auswahllisten im UI. */
export function groupPortsByHolder(rack: Rack): { holderName: string; ports: Port[] }[] {
  const groups: { holderName: string; ports: Port[] }[] = [];
  for (const device of getDevices(rack)) {
    if (device.ports.length > 0) groups.push({ holderName: device.name, ports: device.ports });
  }
  for (const endpoint of rack.externalEndpoints) {
    if (endpoint.ports.length > 0) groups.push({ holderName: endpoint.name, ports: endpoint.ports });
  }
  return groups;
}
