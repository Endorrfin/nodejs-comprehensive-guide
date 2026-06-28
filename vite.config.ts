import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base ('./') + hash routing makes the built site work locally
// (vite preview) and on GitHub Pages under ANY project sub-path with zero config.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // CHANGED (Wave 1): explicit target + no sourcemap + a stable react-vendor chunk
    // so React stays cached across content-only sessions.
    target: "es2022",
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }
        },
      },
    },
  },
});
