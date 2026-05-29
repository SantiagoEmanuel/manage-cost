import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "ManageCost — Gestión de gastos",
        short_name: "ManageCost",
        description: "Controlá tus gastos personales y compartidos. Dividí cuentas, llevá el balance y liquidá deudas de forma simple.",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a0f",
        theme_color: "#7c3aed",
        lang: "es-AR",
        scope: "/",
        orientation: "portrait-primary",
        categories: ["finance", "utilities"],
        icons: [
          { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://api.santiagomustafa.com.ar",
        changeOrigin: true,
      },
    },
  },
});
