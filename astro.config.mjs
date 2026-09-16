// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import astroIcon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://localhost:4321",
  integrations: [astroIcon({ iconDir: "./src/assets/icons" })],
  vite: {
    plugins: [tailwindcss()],
  },
});
