import { rack } from "../data/rack";
import { renderRackView } from "./render/renderRackView";
import { renderConnectionForm } from "./view/connectionForm";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app nicht gefunden");

const heading = document.createElement("h1");
heading.textContent = rack.name;
app.appendChild(heading);

app.appendChild(renderConnectionForm(rack));

const front = renderRackView(rack, "front");
front.classList.add("sheet");
app.appendChild(front);

const rear = renderRackView(rack, "rear");
rear.classList.add("sheet", "sheet--spaced");
app.appendChild(rear);
