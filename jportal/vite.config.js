import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

// Build-time plugin to generate a static theme manifest
function generateThemeManifest() {
  return {
    name: 'generate-theme-manifest',
    buildStart() {
      const userConfigsDir = path.resolve(process.cwd(), 'public/user-configs');
      if (!fs.existsSync(userConfigsDir)) return;

      const files = fs.readdirSync(userConfigsDir);
      const themeFiles = files.filter(f =>
        /^[a-zA-Z0-9_-]+-jportal-(theme|themes)\.config$/.test(f)
      );

      const themes = themeFiles.map(filename => {
        const author = filename.match(
          /^([a-zA-Z0-9_-]+)-jportal-(?:theme|themes)\.config$/
        )?.[1] || 'Unknown';
        return {
          filename,
          author,
          isMultiTheme: filename.includes('-themes.config'),
          url: `/jportal/user-configs/${filename}`
        };
      });

      // write out to public so it ends up in `dist`
      const outDir = path.resolve(process.cwd(), 'public/api');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'themes.json'),
        JSON.stringify({ themes }, null, 2),
        'utf8'
      );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/jportal/",
  plugins: [
    react(),
    generateThemeManifest(),
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
            src: "pwa-icons/circle.svg",
            sizes: "72x72 96x96",
            purpose: "maskable",
          },
          {
            src: "pwa-icons/tire.svg",
            sizes: "128x128 256x256",
          },
          {
            src: "pwa-icons/wheel.svg",
            sizes: "512x512",
          },
        ],
      },
    }),
  ],
  server: (() => {
    if (process.env.NODE_ENV === "development") {
      return {
        host: true,
        https: {
          key: fs.readFileSync('./certs/localhost-key.pem'),
          cert: fs.readFileSync('./certs/localhost.pem'),
        },
      };
    }
    return { host: true };
  })(),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
