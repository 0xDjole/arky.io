import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import AutoImport from "astro-auto-import";
import compress from "@playform/compress";
import icon from "astro-icon";
import svelte from "@astrojs/svelte";
import fs from "fs";
import { loadEnv } from "vite";

// Load env file based on NODE_ENV, load ALL env vars (not just VITE_ prefixed)
// Use 'development' for dev, 'production' for build
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = loadEnv(mode, process.cwd(), '');

const environment = env.PUBLIC_ENVIRONMENT || 'dev';
const config = JSON.parse(fs.readFileSync(`./config/${environment}.json`, 'utf-8'));

// https://astro.build/config
export default defineConfig({
	output: "static",
	site: config.siteUrl,
	image: {
		// Allow any images coming from your CMS domain(s)
		domains: ["storage.arky.io"],
	},
	redirects: {},
	// i18n configuration must match src/config/translations.json.ts
	i18n: {
		defaultLocale: "en",
		locales: ["en", "fr"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	markdown: {
		shikiConfig: {
			// Shiki Themes: https://shiki.style/themes
			theme: "css-variables",
			wrap: true,
		},
	},
	integrations: [
		mdx(),
		icon(),
		sitemap(),
		compress({
			HTML: false,
			JavaScript: true,
			CSS: false, // enabling this can cause issues
			Image: false, // astro:assets handles this. Enabling this can dramatically increase build times
			SVG: false, // astro-icon handles this
		}),
		svelte(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
	experimental: {
		// svg: true,
	},
});
