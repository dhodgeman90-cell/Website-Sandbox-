# About Page Polish + Collector's Guides Hub — Design

**Date:** 2026-06-30
**Status:** Approved design, pending spec review

## Context

The About page ([sections/about.liquid](../../../sections/about.liquid)) is functional but reads as
disconnected blocks (hero → backstops banner → intro+values → a placeholder testimonial → CTA). The
owner wants it to (a) feel cohesive and (b) earn its keep by adding real value to the site.

The chosen lever — inspired by Phill Anton's [Mozaik Guides](https://www.phillanton.com/blogs/mozaik-guides)
— is an SEO content hub. Phill's "guides" is a **Shopify native blog**: tagged how-to articles, each
targeting a search query, that funnel readers toward the product. We'll build the Apex Archive
equivalent ("Collector's Guides") and reconnect the About page so it funnels into it.

**Goal:** A cohesive brand-story About page that feeds a styled, SEO-oriented guides hub seeded with
real cornerstone articles.

**Non-goals:** Tag-filtering UI, article search, comments, author bios, newsletter capture. Deferred
until the library is large enough to need them (YAGNI).

## Architecture

Use Shopify's **native blog system** — the industry-standard, handoff-friendly approach. New guides
are added through Shopify Admin like writing a doc; no code per article.

Two layers:
1. **Theme templates (live in git):** styled `blog` + `article` templates matching the dark-premium
   brand. Built once.
2. **Store content (lives in Shopify, transfers with the store on handoff):** the blog itself + the
   6 seed articles. Created via the Shopify MCP (`graphql_mutation`) for speed, then reviewed/edited
   by the owner in Admin.

Brand tokens to reuse throughout (from existing About/hero CSS): bg `#000`/`#1e1410`, cards `#2c1e12`,
heading cream `#f0ede8`, body `#cccccc`/`#b5a898`, gold accent `#c9a96e`, hairline borders `#1e1e1e`,
Inter body + existing `--font-heading--family`.

## Component 1 — Collector's Guides blog + hub template

- **Blog:** title "Collector's Guides", handle `collectors-guides` → URL `/blogs/collectors-guides`.
- **Template:** `templates/blog.collectors-guides.json` driving a new section
  `sections/collectors-guides-hub.liquid`.
- **Layout:** intro header (eyebrow + title + one-line promise) over a responsive **card grid**.
  Each card = featured image + title + 1-line excerpt, linking to the article. Cleaner than Phill's
  plain tag-list and appropriate at this article count.
- Iterate `blog.articles`; use `article.image`, `article.title`, `article.excerpt_or_content | strip_html | truncatewords`.
- ponytail: card grid, no tag filter/pagination UI — fine under ~12 articles; add when the library grows.

## Component 2 — Article reading template

- **Template:** `templates/article.json` driving `sections/guide-article.liquid` (named generically so
  it serves any future blog article, not just guides).
- **Layout:** centered single-column reader (~720px max-width) for legibility: featured image header,
  title, optional published date, then `article.content` rendered as styled rich text (headings,
  paragraphs, lists, blockquotes, images all themed). Ends with a **"Build your cabinet" CTA strip**
  reusing the About/hero button styles, plus a "← All guides" link back to the hub.
- This is the funnel: every guide ends pointing at the configurator/quote.

## Component 3 — The 6 cornerstone guides (drafted, owner edits)

Each targets a real collector search query and links naturally to the product. Bodies written as clean
semantic HTML for Shopify's rich-text body. **All factual claims researched for accuracy** (archival
materials, real PSA/BGS/CGC slab dimensions, safe humidity/temperature ranges) — not invented.

1. **How to store graded cards (PSA / BGS / CGC slabs) the right way**
2. **Protecting raw cards: penny sleeves, top-loaders & what actually works**
3. **Humidity, light & temperature — the silent enemies of a card collection**
4. **How many cards can you actually store? Slab vs. top-loader capacity planning**
5. **Building a collection room: display vs. long-term storage**
6. **Choosing the right cabinet finish & configuration for your collection** (→ configurator)

Each article gets a short meta description and 2–4 tags (for future filtering / SEO), and an internal
link to the configurator or a relevant guide.

## Component 4 — About page polish ([sections/about.liquid](../../../sections/about.liquid))

- **Keep** the hero and the brand-story intro copy (these are strong).
- **Anchor the story with the drawer image:** the current backstops banner is product-specific and
  reads as disjointed in a brand-story page. Replace it with `assets/drawer-card-cutout.png` (isolated
  maple drawer full of organized slabs/top-loaders) as the page's primary brand-story visual — the
  clearest "this is what we make" image on the site. The backstops image stays available for the
  product/collection pages where it's more relevant.
- **Cohere the value props:** reframe the 5 values as one "why we build this way" flow tied to the
  narrative, rather than a detached 2-column sidebar.
- **Remove the placeholder testimonial** (`— Apex Archive Customer`) so nothing reads as fabricated.
  Structure left ready to re-add a real, styled quote later.
- **Add a "Collector's Guides" teaser** before the final CTA: 3 latest guides (pulled live from the
  blog) + "Read all guides →". This is the About → hub funnel.

## Image plan

- **Drawer cutout** (`drawer-card-cutout.png`): About brand-story feature + header for guide #4 (capacity).
- **Existing hero finishes** (`cabinet-hero-*`): header for guide #6 (finish/configuration).
- **Generated (Higgsfield):** topic-specific headers for guides #1–#3 and #5 (e.g., a humidity/storage
  scene, raw-card protection flatlay, a collection display room). Owner reviews generated options before
  they're committed; fall back to brand photos if any generation isn't on-brand.

## SEO strategy (the point of the whole feature)

The goal is **topical authority** via a pillar-and-spoke structure: the configurator/collection pages
are pillars (what we sell); the guides are spokes (the informational questions buyers ask first, which
product pages can't rank for). Internal links bind them into a knowledge graph Google reads as expertise.

**Built into this project:**
- **Query-shaped titles** as each article's `<title>` / `<h1>`; one `<h1>`, `<h2>` sub-sections.
- **Custom meta description** per guide (Shopify article SEO fields).
- **Depth:** cornerstone guides ~1,500–2,500 words (top-10 results average ~1,890). Comprehensive, not thin.
- **AI-search / AEO passages:** open each section with a clear question→direct-answer passage, because
  AI Overviews extract the answering passage rather than ranking the whole page.
- **Structured data:** add `Article` JSON-LD to the article template (`headline`, `image`, `datePublished`,
  `author`/publisher). Reuse Dawn's existing JSON-LD patterns; don't hand-roll what the theme already emits.
- **Internal linking:** every guide links to 2–3 relevant product/collection pages and 1–2 sibling guides;
  About ↔ hub ↔ articles ↔ configurator.
- **`article.image`** set on every post (cards + social/OG render); descriptive `alt` text.
- **Descriptive URLs** via clean article handles.

**Out of scope — ongoing, owner-side (documented for handoff, not built here):** Google Search Console
verification + sitemap submission (Shopify auto-generates the sitemap), ongoing publishing cadence
(2–4 posts/month), and earning genuine backlinks (collector communities, reviews). No paid/link-farm
links — a penalty risk in 2026. Capture these in the handoff checklist.

## Verification

1. `shopify theme dev --store ywbx1x-1n.myshopify.com` → http://localhost:9292.
2. Visit `/blogs/collectors-guides`: card grid renders, 6 cards with images/titles/excerpts, each links
   to its article.
3. Open each article: themed reader layout, body formatting correct, CTA + back-link work.
4. Visit `/pages/about`: cohesive flow, drawer image present, no placeholder testimonial, guides teaser
   shows 3 latest and links to the hub.
5. Mobile width (≤749px): grid collapses to one column, About sections stack, reader stays legible.
6. Confirm no broken images / 404s (devtools Network).

## Out of scope / future

Tag-filter UI, pagination, search, related-articles, newsletter signup, author pages. Revisit once the
guide library outgrows a single screen.
