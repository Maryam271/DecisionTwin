import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development, calls to /api are forwarded to the FastAPI backend.
// Change the target if the backend runs on a different port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
