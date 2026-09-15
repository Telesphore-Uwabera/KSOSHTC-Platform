import { defineConfig, Plugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { NextFunction, Request, Response } from "express";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Frontend uses clients/.env only (see clients/.env.example)
  const envDir = path.resolve(__dirname, "clients");
  const env = loadEnv(mode, envDir, "");
  // Only use proxy when explicitly requested (run backend separately with pnpm run dev:backend)
  const useProxy =
    env.VITE_DEV_USE_PROXY === "true" && env.BACKEND_URL?.trim();
  const backendUrl = env.BACKEND_URL?.trim();
  const isDev = command === "serve";

  return {
    envDir: "clients",
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./clients", "./shared", "./backend"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
      },
      proxy: useProxy && backendUrl
        ? {
            "/api": {
              target: backendUrl,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [react(), isDev && !useProxy && expressPlugin()].filter(Boolean) as Plugin[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./clients"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      const { pathToFileURL } = await import("url");
      const backendUrl = pathToFileURL(path.resolve(__dirname, "backend/index.ts")).href;
      const { createServer } = await import(backendUrl);
      // apiOnly: true so Express only handles /api/*; GET / is left for Vite to serve the SPA
      const app = createServer({ apiOnly: true });

      // Only send /api requests to Express; everything else (e.g. GET /) stays with Vite so the website loads
      server.middlewares.use((req, res, next) => {
        const url = (req.originalUrl ?? req.url ?? "").toString();
        const lowerUrl = url.toLowerCase();

        const shouldForwardToExpress =
          lowerUrl.startsWith("/api") ||
          // Serve uploaded course PDFs from the backend static handler.
          // Important: we only forward file requests (not `/courses/:courseId` SPA routes).
          (lowerUrl.startsWith("/courses/") && lowerUrl.includes(".pdf")) ||
          lowerUrl.startsWith("/course-covers/");

        if (shouldForwardToExpress) {
          // Vite passes Node http.IncomingMessage; Express app accepts it at runtime.
          return app(req as Request, res as Response, next as NextFunction);
        }
        next();
      });
    },
  };
}
