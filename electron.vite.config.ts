import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import path from "node:path";

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    publicDir: "public",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@renderer": path.resolve("src/renderer/src"),
      },
    },
  },
});
