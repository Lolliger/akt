import { groupPortsByHolder } from "../model/lookup";
import type { CableType, ConnectionStatus, Port, Rack } from "../model/types";

const CABLE_TYPE_LABELS: Record<CableType, string> = {
  cat6: "Cat6 (Netzwerk)",
  xlr: "XLR (Audio)",
  "dmx-cable": "DMX-Kabel",
  phoenix: "Phoenix/Klemme",
  unbekannt: "Unbekannt",
  sonstige: "Sonstige",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  bestaetigt: "Bestätigt (sicher geprüft)",
  angenommen: "Angenommen (vermutet, noch zu prüfen)",
  unbekannt: "Unbekannt / TBD",
};

function portOptionLabel(port: Port): string {
  const faceLabel = port.face === "front" ? "vorne" : port.face === "rear" ? "hinten" : undefined;
  return faceLabel ? `${port.label} (${faceLabel})` : port.label;
}

function buildPortSelect(rack: Rack, name: string): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = name;
  select.required = true;

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "– Port wählen –";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  for (const group of groupPortsByHolder(rack)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.holderName;
    for (const port of group.ports) {
      const option = document.createElement("option");
      option.value = port.id;
      option.textContent = portOptionLabel(port);
      optgroup.appendChild(option);
    }
    select.appendChild(optgroup);
  }

  return select;
}

function buildSelectFromLabels<T extends string>(
  name: string,
  labels: Record<T, string>,
  defaultValue: T,
): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = name;
  for (const [value, label] of Object.entries(labels) as [T, string][]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if (value === defaultValue) option.selected = true;
    select.appendChild(option);
  }
  return select;
}

function field(labelText: string, input: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "connection-form__field";
  const span = document.createElement("span");
  span.textContent = labelText;
  label.appendChild(span);
  label.appendChild(input);
  return label;
}

/**
 * Formular zum Hinzufügen einer Verbindung, ohne dass dafür Code bearbeitet
 * werden muss. Speichert über den lokalen Dev-Endpunkt (/api/connections,
 * siehe vite.config.ts) direkt in data/connections.json.
 */
export function renderConnectionForm(rack: Rack): HTMLElement {
  const container = document.createElement("section");
  container.className = "connection-form";

  const heading = document.createElement("h2");
  heading.textContent = "Verbindung hinzufügen";
  container.appendChild(heading);

  const form = document.createElement("form");

  const portASelect = buildPortSelect(rack, "portAId");
  const portBSelect = buildPortSelect(rack, "portBId");
  const cableSelect = buildSelectFromLabels("cableType", CABLE_TYPE_LABELS, "unbekannt");
  const statusSelect = buildSelectFromLabels("status", STATUS_LABELS, "bestaetigt");
  const descriptionInput = document.createElement("input");
  descriptionInput.type = "text";
  descriptionInput.name = "description";
  descriptionInput.placeholder = "optional";

  form.appendChild(field("Port A", portASelect));
  form.appendChild(field("Port B", portBSelect));
  form.appendChild(field("Kabeltyp", cableSelect));
  form.appendChild(field("Status", statusSelect));
  form.appendChild(field("Beschreibung", descriptionInput));

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Verbindung speichern";
  form.appendChild(submitButton);

  const message = document.createElement("p");
  message.className = "connection-form__message";
  form.appendChild(message);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("connection-form__message--error");

    if (portASelect.value === portBSelect.value) {
      message.textContent = "Port A und Port B dürfen nicht identisch sein.";
      message.classList.add("connection-form__message--error");
      return;
    }

    submitButton.disabled = true;
    fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portAId: portASelect.value,
        portBId: portBSelect.value,
        cableType: cableSelect.value === "unbekannt" ? undefined : cableSelect.value,
        status: statusSelect.value,
        description: descriptionInput.value.trim() || undefined,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server antwortete mit ${res.status}`);
        return res.json();
      })
      .then((saved: { displayId: string }) => {
        message.textContent = `${saved.displayId} gespeichert – Zeichnung wird neu geladen …`;
        setTimeout(() => location.reload(), 600);
      })
      .catch((err: unknown) => {
        submitButton.disabled = false;
        message.textContent = `Fehler beim Speichern: ${String(err)}`;
        message.classList.add("connection-form__message--error");
      });
  });

  container.appendChild(form);
  return container;
}
