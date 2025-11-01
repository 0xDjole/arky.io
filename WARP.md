# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Astro 5 (static output) with Svelte islands, Tailwind CSS v4 (via @tailwindcss/vite), MDX, and custom i18n (en, fr).
- Runtime config: Selected by PUBLIC_ENVIRONMENT (dev/prod) to pick ./config/<env>.json for apiUrl, storageUrl, siteUrl, businessId.
- Data layer: Reads content and commerce data from remote APIs (no local DB). Core HTTP wrapper lives in src/lib/core/services/http.ts.
- i18n and routing: Localized routes under src/pages/[...locale]/ with Astro’s getStaticPaths generating en and fr. Helper utilities and dictionaries in src/lib/i18n.

Common commands
- Install dependencies
```sh path=null start=null
npm install
```
- Start dev server (default dev config)
```sh path=null start=null
npm run dev
```
- Build (static output)
```sh path=null start=null
# dev config (default)
npm run build
# production config
PUBLIC_ENVIRONMENT=prod npm run build
```
- Preview built site
```sh path=null start=null
npm run preview
# to preview with production config
PUBLIC_ENVIRONMENT=prod npm run preview
```
- Lint and format
```sh path=null start=null
npm run lint
npm run format
```
- Tests: No test runner is configured in this repo at present.

Architecture and key concepts
- Runtime configuration (config/*.json, src/appConfig.ts, astro.config.mjs)
  - ./config/dev.json and ./config/prod.json define environment, apiUrl, storageUrl, siteUrl, businessId.
  - src/appConfig.ts selects the JSON based on import.meta.env.PUBLIC_ENVIRONMENT (default "dev").
  - astro.config.mjs reads process.env.PUBLIC_ENVIRONMENT and loads the same JSON to set site (for sitemap/etc), image domains, and i18n locales (must match src/lib/i18n).
  - Static output is enabled (output: "static"). Integrations: mdx, astro-icon, sitemap, @playform/compress (JS only), @astrojs/svelte, Tailwind via Vite plugin.

- Pages and localized routing (src/pages)
  - All localized routes live under src/pages/[...locale]/. Each page exports getStaticPaths to generate both locales and omits a prefix for the default locale (en).
  - Example: src/pages/[...locale]/index.astro pulls site content via cmsApi and composes Astro and Svelte components; src/pages/[...locale]/cart.astro mounts a Svelte cart island.
  - A non-localized 404.astro exists at src/pages/404.astro.

- i18n utilities and dictionaries (src/lib/i18n/index.ts)
  - textTranslations: nested keys for UI, forms, reservation, cart, etc. in en and fr.
  - routeTranslations: keys for route segment translation and helpers to compute localized URLs (getRelativeLocaleUrl, getLocalizedPathname).
  - getStaticPaths in pages uses locales/defaultLocale exported here and must remain consistent with astro.config.mjs.

- Core library (src/lib and src/lib/core)
  - API endpoints and HTTP
    - src/lib/core/config.ts bridges appConfig values to exported constants (API_URL, BUSINESS_ID, STORAGE_URL).
    - src/lib/core/services/http.ts is a small fetch wrapper with optional query params. All CMS/E‑shop/Reservation APIs call through this or fetch directly when needed.
    - CMS API (src/lib/core/api/cms.ts) fetches collections/entries by businessId; high-level cmsApi re-exported from src/lib/index.ts adds block helpers.
  - Content block helpers (src/lib/index.ts)
    - Provides functions to unwrap nested CMS blocks into plain objects, read localized values, and prepare blocks for submission (getBlockFromArray, getBlockObjectValues, unwrapBlock, etc.).
  - Commerce and reservations
    - E‑shop API and helpers (eshopApi) for products and checkout, including Stripe payment intent creation (token via reservationApi.getGuestToken).
    - Reservation API (reservationApi) for available slots, providers, phone verification, and reservation checkout.
  - State and UI helpers
    - Nanostores-based toast store (src/lib/toast.js) and animation setup with GSAP + Lenis (src/lib/animation.js) used by interactive pages like work.astro.

- Styling (Tailwind CSS v4)
  - Tailwind is configured via the Vite plugin in astro.config.mjs. Theme and global styles live under src/styles (e.g., tailwind-theme.css, global.css).

- Path aliases (tsconfig.json)
  - @config/* → src/config/*
  - @lib/* → src/lib/*
  - @layouts/* → src/layouts/*
  - @components/* → src/components/*
  - @assets/* → src/assets/*, plus @images/* and @videos/*
  - @/* → src/*

Environment notes
- PUBLIC_ENVIRONMENT controls both build-time config (astro.config.mjs) and runtime selection in src/appConfig.ts. When running build/preview for production, set PUBLIC_ENVIRONMENT=prod to align siteUrl and API targets with ./config/prod.json.

Important design rules (from CLAUDE.md)
- Performance targets: LCP < 2.5s, CLS < 0.1, FID < 100ms; defer JS, inline critical CSS; prefer transforms/opacity for animations.
- Accessibility: Aim for WCAG AAA; keyboard navigable interactions, visible focus states, semantic HTML, respect prefers-reduced-motion.
- Visual/animation guidelines: 8px spacing grid, strong contrast; default easing cubic-bezier(0.4,0,0.2,1), durations ~200–600ms, stagger 50–100ms; avoid over-animation.

Notes for future modifications
- Keep locales in astro.config.mjs and src/lib/i18n/index.ts in sync.
- If adding new localized routes, prefer the [...locale] folder and generate getStaticPaths from locales/defaultLocale.
- When introducing tests, add a test runner (e.g., Vitest or Playwright) and corresponding scripts; until then, do not assume test commands exist.
