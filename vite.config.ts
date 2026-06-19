import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base ('./') + hash routing makes the built site work locally
// (vite preview) and on GitHub Pages under ANY project sub-path with zero config.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1200,
  },
});
