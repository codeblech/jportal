import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: "/jportal/",
    plugins: [
      react(),
      svgr(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        devOptions: {
          enabled: true,
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 30 * 1024 ** 2, // 30MB
          globPatterns: ["**/*.{js,css,html,ico,png,svg,whl}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\/v0\.23\.4\/full\/pyodide\.js$/,
              handler: "CacheFirst",
              options: {
                cacheName: "pyodide-cache",
                expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 1000, // 1000 days
                },
              },
            },
          ],
          additionalManifestEntries: [
            { url: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js", revision: null },
            { url: "/jportal/artifact/jiit_marks-0.2.0-py3-none-any.whl", revision: null },
            { url: "/jportal/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl", revision: null },
          ],
        },
        manifest: {
          name: "JPortal",
          short_name: "JPortal",
          description: "A web portal for students to view attendance and grades.",
          start_url: "/jportal/",
          display: "standalone",
          background_color: "#191c20",
          theme_color: "#191c20",
          orientation: "portrait",
          icons: [
            {
              src: "pwa-icons/circle.ico",
              sizes: "48x48",
            },
            {
              src: "pwa-icons/j-yuvraj.svg",
              sizes: "72x72 96x96",
              purpose: "maskable",
            },
            {
              src: "pwa-icons/j-yuvraj.svg",
              sizes: "128x128 256x256",
            },
            {
              src: "pwa-icons/j-yuvraj.svg",
              sizes: "512x512",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api/cloudflare": {
          target: "https://api.cloudflare.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cloudflare/, ""),
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              // Add Authorization header from environment variable
              const token = env.VITE_CLOUDFLARE_API_TOKEN;
              if (token) {
                proxyReq.setHeader("Authorization", `Bearer ${token}`);
              }
            });
          },
        },
      },
    },
  };
});
