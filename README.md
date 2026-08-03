# nickmcguffin.dev

Personal site and blog — [nickmcguffin.dev](https://nickmcguffin.dev).

A static Astro site. No server, no database, no adapter: `astro build` emits plain HTML into
`dist/`, and pushing to `main` publishes it to GitHub Pages.

## Stack

- **Astro 7** — static output. Posts are MDX so a post can drop in a component when prose isn't enough.
- **Tailwind v4** via the Vite plugin, configured entirely in CSS. There is no `tailwind.config.js` — see [Design system](#design-system).
- **`@astrojs/rss`** → `/rss.xml`, **`@astrojs/sitemap`** → `/sitemap-index.xml`.
- **Shiki** for code blocks, dual-themed to follow light/dark.

## Run it

Node `>=22.12.0`, npm.

```sh
npm install
npm run dev        # localhost:4321
npm run build      # → dist/
npm run preview    # serve the built site
npm run check      # astro check — type-checks .astro and .ts
```

The dev server also runs detached, which is the workflow `AGENTS.md` assumes:

```sh
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## Writing a post

Add an `.mdx` file to `src/content/blog/`. The filename becomes the slug —
`hello-world.mdx` → `/blog/hello-world`.

```yaml
---
title: 'Post title'              # required
description: 'One-line deck.'    # required — used on post rows, <meta>, and RSS
published: 2026-07-31            # required — coerced to a Date
tags: ['astro', 'css']           # optional — parsed, but not rendered anywhere yet
draft: false                     # optional — see below
---
```

Schema lives in `src/content.config.mjs`. Two things to know:

- **The loader globs `.mdx` only.** A `.md` file is ignored silently — no error, it just never
  appears.
- **`draft: true` hides a post from builds but keeps it in `dev`,** so you can preview work in
  progress at its real URL. In a production build it gets no page, and it's absent from the blog
  index, the homepage, RSS, and the sitemap. That filter lives in `getPosts()` in
  `src/lib/posts.ts` — use it rather than calling `getCollection('blog')` directly, or drafts will
  leak.

`##` and `###` headings populate the table of contents. Deeper levels are ignored.

## Design system

Almost none of this is discoverable from the file tree, so:

**Colour** — two palettes as CSS custom properties on `:root` and `.dark` in
`src/styles/global.css`, named by role rather than by colour so class names read correctly in both
modes: `--bg`, `--fg`, `--muted`, `--rule`, `--accent`, `--code-bg`.

They reach Tailwind through `@theme inline { --color-bg: var(--bg); … }`, which yields `bg-bg`,
`text-fg`, `text-muted`, `border-rule`, `text-accent`. **The `inline` keyword is load-bearing** —
without it Tailwind resolves each var to a literal at build time and the runtime theme toggle stops
working. `--code-bg` is deliberately not in that block; it's only consumed by the `.post` rules, so
there's no `bg-code-bg` utility.

**Dark mode** is class-based (`@custom-variant dark`), driven by `.dark` on `<html>`. The toggle in
`src/layouts/Base.astro` writes the choice to `localStorage`; a small inline script in `<head>`
applies it before first paint, falling back to `prefers-color-scheme`. It has to stay inline and
unbundled, or the page flashes the wrong theme on load.

**Type** — Archivo Variable (display), IBM Plex Sans (body), IBM Plex Mono (labels, dates, code).
Self-hosted through Fontsource; declared in a plain `@theme` block so they also emit as real custom
properties the `.post` rules can use.

**Post body** — Preflight strips every element default, so rendered MDX is styled explicitly, tag
by tag, under `.post` in `global.css`. A new element in a post needs a rule there or it renders
bare.

**Code blocks** — Shiki, `vitesse-light` / `vitesse-dark`. The config in `astro.config.ts` is
passed to **both** `markdown` and `mdx()`; MDX doesn't inherit the top-level markdown config, and
dropping either one silently half-breaks highlighting. `.post .astro-code` overrides the background
to `--code-bg`, and the dark variant swaps token colours via `--shiki-dark`.

**Motion** — the animated `RouteGraphic` is wrapped in `prefers-reduced-motion: no-preference`, so
its resting state is the finished graphic.

## Structure

```
src/
├── pages/
│   ├── index.astro          # homepage — hero + 3 most recent posts
│   ├── rss.xml.ts           # /rss.xml
│   └── blog/
│       ├── index.astro      # post index
│       └── [...slug].astro  # post page — TOC, reading time
├── layouts/
│   └── Base.astro           # <head>, SEO meta, theme toggle, header, footer
├── components/
│   ├── PostRow.astro        # one row in a post list
│   ├── TableOfContents.astro
│   └── RouteGraphic.astro   # hand-authored animated SVG
├── lib/
│   └── posts.ts             # getPosts() / getReadingMinutes()
├── content/blog/            # posts (.mdx)
├── content.config.mjs       # collection schema
└── styles/global.css        # theme tokens + .post styles
```

## Deploy

`.github/workflows/deploy.yml` runs on push to `main`, or manually via workflow dispatch.
`withastro/action` installs, builds, and uploads the Pages artifact; `actions/deploy-pages`
publishes it.

The `nickmcguffin.dev` custom domain is configured in the **repo's GitHub Pages settings**, not by
a `CNAME` file in `public/`. Worth knowing before wondering why the domain isn't in the codebase.

## SEO

`site` in `astro.config.ts` is the root of all absolute URLs — canonical tags, the sitemap, and RSS
links all derive from it, so changing the domain is a one-line change. `public/robots.txt` points
crawlers at `/sitemap-index.xml`. Per-page titles, descriptions, and Open Graph tags come from
`Base.astro` props; passing `published` flips `og:type` to `article` and adds
`article:published_time`.
