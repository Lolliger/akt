import { rack } from "../data/rack";
import { renderRackView } from "./render/renderRackView";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app nicht gefunden");

const heading = document.createElement("h1");
heading.textContent = rack.name;
app.appendChild(heading);

const front = renderRackView(rack, "front");
front.classList.add("sheet");
app.appendChild(front);
