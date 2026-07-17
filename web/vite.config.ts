import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "spa-fallback",
      closeBundle() {
        // Copy index.html to 404.html so static hosts serve the SPA for unknown routes
        const distDir = resolve(__dirname, "dist");
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        copyFileSync(resolve(distDir, "index.html"), resolve(distDir, "404.html"));
        // Also copy to common SPA fallback names
        for (const name of ["200.html", "index.html.bak"]) {
          try {
            copyFileSync(resolve(distDir, "index.html"), resolve(distDir, name));
          } catch {
            // ignore
          }
        }
      },
    },
  ],
  server: { port: 5173 },
});
