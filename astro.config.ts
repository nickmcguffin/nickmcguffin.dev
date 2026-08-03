// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

const shikiConfig = {
	themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
} as const;

// https://astro.build/config
export default defineConfig({
	site: 'https://nickmcguffin.dev',
	markdown: { shikiConfig },
	integrations: [mdx({ shikiConfig }), sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
});
