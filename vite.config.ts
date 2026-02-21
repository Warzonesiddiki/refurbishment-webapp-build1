import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type ProxyOptions } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_PROXY_TARGET = process.env.VITE_LOCAL_API_PROXY_TARGET || "http://127.0.0.1:8085";

function createApiProxyOptions(): ProxyOptions {
  return {
    target: API_PROXY_TARGET,
    changeOrigin: true,
    secure: false,
    configure(proxy) {
      proxy.on("error", (error, _req, res) => {
        if ("writeHead" in res && typeof res.writeHead === "function" && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
        }
        if ("end" in res && typeof res.end === "function") {
          res.end(
            JSON.stringify({
              error: "api_proxy_unavailable",
              message: `Could not reach Java API at ${API_PROXY_TARGET}. Start it with: npm run java:server`,
            }),
          );
        }

        console.warn(`[vite-proxy] /api backend unavailable at ${API_PROXY_TARGET}: ${error.message}`);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // LAN/mobile device testing defaults
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": createApiProxyOptions(),
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    proxy: {
      "/api": createApiProxyOptions(),
    },
  },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
