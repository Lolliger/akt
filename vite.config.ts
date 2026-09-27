import { defineConfig, type Plugin } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";

const connectionsFile = fileURLToPath(new URL("./data/connections.json", import.meta.url));

/**
 * Lokaler Speicher-Endpunkt, nur während `npm run dev` aktiv (kein echter
 * Server, kein Deployment nötig). Erlaubt es, Verbindungen über das
 * Formular im Browser hinzuzufügen, statt data/connections.json von Hand
 * zu bearbeiten.
 */
function connectionsApiPlugin(): Plugin {
  return {
    name: "connections-api",
    configureServer(server) {
      server.middlewares.use("/api/connections", (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          void (async () => {
            try {
              const payload = JSON.parse(body);
              const current = JSON.parse(await readFile(connectionsFile, "utf-8"));

              const usedNumbers = current
                .map((c: { displayId?: string }) => /^K(\d+)$/.exec(c.displayId ?? ""))
                .filter((m: RegExpExecArray | null): m is RegExpExecArray => m !== null)
                .map((m: RegExpExecArray) => Number(m[1]));
              const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

              const newConnection = {
                id: `conn-${Date.now()}`,
                displayId: `K${String(nextNumber).padStart(3, "0")}`,
                portAId: payload.portAId,
                portBId: payload.portBId,
                cableType: payload.cableType || undefined,
                status: payload.status,
                description: payload.description || undefined,
              };

              current.push(newConnection);
              await writeFile(connectionsFile, JSON.stringify(current, null, 2) + "\n");

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(newConnection));
            } catch (err) {
              res.statusCode = 400;
              res.end(String(err));
            }
          })();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [connectionsApiPlugin()],
  resolve: {
    alias: {
      "@model": fileURLToPath(new URL("./src/model", import.meta.url)),
      "@layout": fileURLToPath(new URL("./src/layout", import.meta.url)),
      "@render": fileURLToPath(new URL("./src/render", import.meta.url)),
      "@export": fileURLToPath(new URL("./src/export", import.meta.url)),
      "@data": fileURLToPath(new URL("./data", import.meta.url)),
    },
  },
});
