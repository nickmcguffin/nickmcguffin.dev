// @ts-check
import { defineConfig } from 'astro/config';
import mdx from "@astrojs/mdx";

import tailwindcss from "@tailwindcss/vite";

const shikiConfig = {
  themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
} as const;

// https://astro.build/config
export default defineConfig({
  site: "https://nickmcguffin.dev",
  markdown: { shikiConfig },
  integrations: [mdx({ shikiConfig })],
  vite: {
    plugins: [tailwindcss()]
  }
});