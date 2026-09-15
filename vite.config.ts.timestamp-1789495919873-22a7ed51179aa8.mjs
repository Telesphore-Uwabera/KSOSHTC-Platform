// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/uwabe/Desktop/KSOSHTC-Platform/node_modules/.pnpm/vite@5.4.10_@types+node@24.2.1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/uwabe/Desktop/KSOSHTC-Platform/node_modules/.pnpm/@vitejs+plugin-react-swc@3._dc914752374fbd909fd043007546cdfd/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\uwabe\\Desktop\\KSOSHTC-Platform";
var vite_config_default = defineConfig(({ mode, command }) => {
  const envDir = path.resolve(__vite_injected_original_dirname, "clients");
  const env = loadEnv(mode, envDir, "");
  const useProxy = env.VITE_DEV_USE_PROXY === "true" && env.BACKEND_URL?.trim();
  const backendUrl = env.BACKEND_URL?.trim();
  const isDev = command === "serve";
  return {
    envDir: "clients",
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./clients", "./shared", "./backend"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"]
      },
      proxy: useProxy && backendUrl ? {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      } : void 0
    },
    build: {
      outDir: "dist/spa"
    },
    plugins: [react(), isDev && !useProxy && expressPlugin()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./clients"),
        "@shared": path.resolve(__vite_injected_original_dirname, "./shared")
      },
      extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"]
    }
  };
});
function expressPlugin() {
  return {
    name: "express-plugin",
    apply: "serve",
    // Only apply during development (serve mode)
    async configureServer(server) {
      const { pathToFileURL } = await import("url");
      const backendUrl = pathToFileURL(path.resolve(__vite_injected_original_dirname, "backend/index.ts")).href;
      const { createServer } = await import(backendUrl);
      const app = createServer({ apiOnly: true });
      server.middlewares.use((req, res, next) => {
        const url = (req.originalUrl ?? req.url ?? "").toString();
        const lowerUrl = url.toLowerCase();
        const shouldForwardToExpress = lowerUrl.startsWith("/api") || // Serve uploaded course PDFs from the backend static handler.
        // Important: we only forward file requests (not `/courses/:courseId` SPA routes).
        lowerUrl.startsWith("/courses/") && lowerUrl.includes(".pdf") || lowerUrl.startsWith("/course-covers/");
        if (shouldForwardToExpress) {
          return app(req, res, next);
        }
        next();
      });
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1d2FiZVxcXFxEZXNrdG9wXFxcXEtTT1NIVEMtUGxhdGZvcm1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHV3YWJlXFxcXERlc2t0b3BcXFxcS1NPU0hUQy1QbGF0Zm9ybVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdXdhYmUvRGVza3RvcC9LU09TSFRDLVBsYXRmb3JtL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4sIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgdHlwZSB7IE5leHRGdW5jdGlvbiwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tIFwiZXhwcmVzc1wiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4ge1xyXG4gIC8vIEZyb250ZW5kIHVzZXMgY2xpZW50cy8uZW52IG9ubHkgKHNlZSBjbGllbnRzLy5lbnYuZXhhbXBsZSlcclxuICBjb25zdCBlbnZEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImNsaWVudHNcIik7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBlbnZEaXIsIFwiXCIpO1xyXG4gIC8vIE9ubHkgdXNlIHByb3h5IHdoZW4gZXhwbGljaXRseSByZXF1ZXN0ZWQgKHJ1biBiYWNrZW5kIHNlcGFyYXRlbHkgd2l0aCBwbnBtIHJ1biBkZXY6YmFja2VuZClcclxuICBjb25zdCB1c2VQcm94eSA9XHJcbiAgICBlbnYuVklURV9ERVZfVVNFX1BST1hZID09PSBcInRydWVcIiAmJiBlbnYuQkFDS0VORF9VUkw/LnRyaW0oKTtcclxuICBjb25zdCBiYWNrZW5kVXJsID0gZW52LkJBQ0tFTkRfVVJMPy50cmltKCk7XHJcbiAgY29uc3QgaXNEZXYgPSBjb21tYW5kID09PSBcInNlcnZlXCI7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBlbnZEaXI6IFwiY2xpZW50c1wiLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIGhvc3Q6IFwiOjpcIixcclxuICAgICAgcG9ydDogODA4MCxcclxuICAgICAgZnM6IHtcclxuICAgICAgICBhbGxvdzogW1wiLi9jbGllbnRzXCIsIFwiLi9zaGFyZWRcIiwgXCIuL2JhY2tlbmRcIl0sXHJcbiAgICAgICAgZGVueTogW1wiLmVudlwiLCBcIi5lbnYuKlwiLCBcIioue2NydCxwZW19XCIsIFwiKiovLmdpdC8qKlwiXSxcclxuICAgICAgfSxcclxuICAgICAgcHJveHk6IHVzZVByb3h5ICYmIGJhY2tlbmRVcmxcclxuICAgICAgICA/IHtcclxuICAgICAgICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICAgICAgICB0YXJnZXQ6IGJhY2tlbmRVcmwsXHJcbiAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgb3V0RGlyOiBcImRpc3Qvc3BhXCIsXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW3JlYWN0KCksIGlzRGV2ICYmICF1c2VQcm94eSAmJiBleHByZXNzUGx1Z2luKCldLmZpbHRlcihCb29sZWFuKSBhcyBQbHVnaW5bXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2NsaWVudHNcIiksXHJcbiAgICAgICAgXCJAc2hhcmVkXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zaGFyZWRcIiksXHJcbiAgICAgIH0sXHJcbiAgICAgIGV4dGVuc2lvbnM6IFtcIi5tanNcIiwgXCIuanNcIiwgXCIubXRzXCIsIFwiLnRzXCIsIFwiLmpzeFwiLCBcIi50c3hcIiwgXCIuanNvblwiXSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBleHByZXNzUGx1Z2luKCk6IFBsdWdpbiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwiZXhwcmVzcy1wbHVnaW5cIixcclxuICAgIGFwcGx5OiBcInNlcnZlXCIsIC8vIE9ubHkgYXBwbHkgZHVyaW5nIGRldmVsb3BtZW50IChzZXJ2ZSBtb2RlKVxyXG4gICAgYXN5bmMgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xyXG4gICAgICBjb25zdCB7IHBhdGhUb0ZpbGVVUkwgfSA9IGF3YWl0IGltcG9ydChcInVybFwiKTtcclxuICAgICAgY29uc3QgYmFja2VuZFVybCA9IHBhdGhUb0ZpbGVVUkwocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJiYWNrZW5kL2luZGV4LnRzXCIpKS5ocmVmO1xyXG4gICAgICBjb25zdCB7IGNyZWF0ZVNlcnZlciB9ID0gYXdhaXQgaW1wb3J0KGJhY2tlbmRVcmwpO1xyXG4gICAgICAvLyBhcGlPbmx5OiB0cnVlIHNvIEV4cHJlc3Mgb25seSBoYW5kbGVzIC9hcGkvKjsgR0VUIC8gaXMgbGVmdCBmb3IgVml0ZSB0byBzZXJ2ZSB0aGUgU1BBXHJcbiAgICAgIGNvbnN0IGFwcCA9IGNyZWF0ZVNlcnZlcih7IGFwaU9ubHk6IHRydWUgfSk7XHJcblxyXG4gICAgICAvLyBPbmx5IHNlbmQgL2FwaSByZXF1ZXN0cyB0byBFeHByZXNzOyBldmVyeXRoaW5nIGVsc2UgKGUuZy4gR0VUIC8pIHN0YXlzIHdpdGggVml0ZSBzbyB0aGUgd2Vic2l0ZSBsb2Fkc1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IChyZXEub3JpZ2luYWxVcmwgPz8gcmVxLnVybCA/PyBcIlwiKS50b1N0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IGxvd2VyVXJsID0gdXJsLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNob3VsZEZvcndhcmRUb0V4cHJlc3MgPVxyXG4gICAgICAgICAgbG93ZXJVcmwuc3RhcnRzV2l0aChcIi9hcGlcIikgfHxcclxuICAgICAgICAgIC8vIFNlcnZlIHVwbG9hZGVkIGNvdXJzZSBQREZzIGZyb20gdGhlIGJhY2tlbmQgc3RhdGljIGhhbmRsZXIuXHJcbiAgICAgICAgICAvLyBJbXBvcnRhbnQ6IHdlIG9ubHkgZm9yd2FyZCBmaWxlIHJlcXVlc3RzIChub3QgYC9jb3Vyc2VzLzpjb3Vyc2VJZGAgU1BBIHJvdXRlcykuXHJcbiAgICAgICAgICAobG93ZXJVcmwuc3RhcnRzV2l0aChcIi9jb3Vyc2VzL1wiKSAmJiBsb3dlclVybC5pbmNsdWRlcyhcIi5wZGZcIikpIHx8XHJcbiAgICAgICAgICBsb3dlclVybC5zdGFydHNXaXRoKFwiL2NvdXJzZS1jb3ZlcnMvXCIpO1xyXG5cclxuICAgICAgICBpZiAoc2hvdWxkRm9yd2FyZFRvRXhwcmVzcykge1xyXG4gICAgICAgICAgLy8gVml0ZSBwYXNzZXMgTm9kZSBodHRwLkluY29taW5nTWVzc2FnZTsgRXhwcmVzcyBhcHAgYWNjZXB0cyBpdCBhdCBydW50aW1lLlxyXG4gICAgICAgICAgcmV0dXJuIGFwcChyZXEgYXMgUmVxdWVzdCwgcmVzIGFzIFJlc3BvbnNlLCBuZXh0IGFzIE5leHRGdW5jdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVCxTQUFTLGNBQXNCLGVBQWU7QUFDL1YsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxNQUFNO0FBRWpELFFBQU0sU0FBUyxLQUFLLFFBQVEsa0NBQVcsU0FBUztBQUNoRCxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsRUFBRTtBQUVwQyxRQUFNLFdBQ0osSUFBSSx1QkFBdUIsVUFBVSxJQUFJLGFBQWEsS0FBSztBQUM3RCxRQUFNLGFBQWEsSUFBSSxhQUFhLEtBQUs7QUFDekMsUUFBTSxRQUFRLFlBQVk7QUFFMUIsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sSUFBSTtBQUFBLFFBQ0YsT0FBTyxDQUFDLGFBQWEsWUFBWSxXQUFXO0FBQUEsUUFDNUMsTUFBTSxDQUFDLFFBQVEsVUFBVSxlQUFlLFlBQVk7QUFBQSxNQUN0RDtBQUFBLE1BQ0EsT0FBTyxZQUFZLGFBQ2Y7QUFBQSxRQUNFLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRixJQUNBO0FBQUEsSUFDTjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLElBQ1Y7QUFBQSxJQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLFlBQVksY0FBYyxDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDeEUsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsV0FBVztBQUFBLFFBQ3hDLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFVBQVU7QUFBQSxNQUMvQztBQUFBLE1BQ0EsWUFBWSxDQUFDLFFBQVEsT0FBTyxRQUFRLE9BQU8sUUFBUSxRQUFRLE9BQU87QUFBQSxJQUNwRTtBQUFBLEVBQ0Y7QUFDRixDQUFDO0FBRUQsU0FBUyxnQkFBd0I7QUFDL0IsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsSUFDUCxNQUFNLGdCQUFnQixRQUFRO0FBQzVCLFlBQU0sRUFBRSxjQUFjLElBQUksTUFBTSxPQUFPLEtBQUs7QUFDNUMsWUFBTSxhQUFhLGNBQWMsS0FBSyxRQUFRLGtDQUFXLGtCQUFrQixDQUFDLEVBQUU7QUFDOUUsWUFBTSxFQUFFLGFBQWEsSUFBSSxNQUFNLE9BQU87QUFFdEMsWUFBTSxNQUFNLGFBQWEsRUFBRSxTQUFTLEtBQUssQ0FBQztBQUcxQyxhQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGNBQU0sT0FBTyxJQUFJLGVBQWUsSUFBSSxPQUFPLElBQUksU0FBUztBQUN4RCxjQUFNLFdBQVcsSUFBSSxZQUFZO0FBRWpDLGNBQU0seUJBQ0osU0FBUyxXQUFXLE1BQU07QUFBQTtBQUFBLFFBR3pCLFNBQVMsV0FBVyxXQUFXLEtBQUssU0FBUyxTQUFTLE1BQU0sS0FDN0QsU0FBUyxXQUFXLGlCQUFpQjtBQUV2QyxZQUFJLHdCQUF3QjtBQUUxQixpQkFBTyxJQUFJLEtBQWdCLEtBQWlCLElBQW9CO0FBQUEsUUFDbEU7QUFDQSxhQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
