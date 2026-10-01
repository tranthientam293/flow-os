import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const port = parseInt(env.VITE_APP_PORT) || 5173;

  return {
    plugins: [react(), tailwindcss()],
    server: { host: true, port, strictPort: true },
    preview: { host: true, port: 4173 },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  };
});
