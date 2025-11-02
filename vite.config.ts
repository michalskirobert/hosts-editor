import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/web",
    assetsDir: "assets",
  },
  define: {
    global: {},
  },
  plugins: [react(), tsconfigPaths()],
});
