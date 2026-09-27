import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
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
