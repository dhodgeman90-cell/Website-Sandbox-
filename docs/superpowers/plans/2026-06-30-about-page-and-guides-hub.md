# About Page Polish + Collector's Guides Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the About page into a cohesive brand-story page and stand up an SEO-oriented "Collector's Guides" blog hub seeded with 6 researched cornerstone articles that funnel readers to the configurator.

**Architecture:** Shopify native blog + template-suffixed theme templates (so Dawn's default blog/article rendering stays untouched). Two new self-contained sections (hub grid, article reader) following the theme's existing pattern of standalone custom sections with inline styles + `{% schema %}` (see [sections/about.liquid](../../../sections/about.liquid), [sections/homepage-hero.liquid](../../../sections/homepage-hero.liquid)). Blog + articles are store content created via the Shopify MCP.

**Tech Stack:** Shopify Liquid, Online Store 2.0 JSON templates, Shopify Admin GraphQL (via MCP), Higgsfield image generation, Shopify CLI (`theme dev`, `theme check`).

**Spec:** [docs/superpowers/specs/2026-06-30-about-page-and-guides-hub-design.md](../specs/2026-06-30-about-page-and-guides-hub-design.md)
**Approved visual reference:** the mockup at the session scratchpad `mockup.html` — its CSS is the source of truth for all styling below. Port styles verbatim, namespaced per the class prefixes named in each task.

**Brand tokens (reuse everywhere):** bg `#000` / `#1e1410`, card `#2c1e12` / `#1e1410`, heading cream `#f0ede8`, body `#cccccc` / `#b5a898`, muted `#888`, gold accent `#c9a96e`, hairline border `#1e1e1e`, Inter body + `var(--font-heading--family)` headings.

---

## Working notes (read first)

- **No automated tests** — this is a Liquid theme. "Verify" = `shopify theme check` (lint) + the live `shopify theme dev` preview at http://localhost:9292 + Shopify MCP reads. Each task ends by confirming one of these.
- **GitHub sync:** `main` auto-deploys to the live theme. Do this work on a **branch** (`git checkout -b feature/guides-hub`) and only merge to `main` when the owner approves. Commit after each task; do **not** push/merge without asking.
- **Store content is live immediately:** the blog + articles created via MCP exist on the store as soon as they're created. Create articles **published** (the store is pre-launch) but confirm with the owner before treating them as final; they can be unpublished in Admin if needed.
- **Commands:** run all `shopify` commands from `c:\VS Code\Website Fuckery`.

---

## Task 1: Collector's Guides hub (section + template)

**Files:**
- Create: `sections/collectors-guides-hub.liquid`
- Create: `templates/blog.collectors-guides.json`

- [ ] **Step 1: Create the hub section**

Create `sections/collectors-guides-hub.liquid`. Port the hub-grid CSS from the approved mockup, namespaced `.cg-*`. Markup + Liquid:

```liquid
<div class="cg">
  <div class="cg__head wrap">
    <p class="cg__eyebrow">{{ section.settings.eyebrow | default: "Collector's Guides" }}</p>
    <h1 class="cg__title">{{ section.settings.heading | default: "Storage, preservation &amp; collecting, done right" }}</h1>
    {%- if section.settings.intro != blank -%}<p class="cg__intro">{{ section.settings.intro }}</p>{%- endif -%}
  </div>

  <div class="cg__grid wrap">
    {%- for article in blog.articles -%}
      <a class="cg__card" href="{{ article.url }}">
        {%- if article.image -%}
          <span class="cg__thumb" style="background-image:url('{{ article.image | image_url: width: 700 }}');"></span>
        {%- else -%}
          <span class="cg__thumb cg__thumb--ph"><span>{{ article.title | truncatewords: 3 }}</span></span>
        {%- endif -%}
        <span class="cg__cbody">
          {%- if article.tags.size > 0 -%}<span class="cg__ctag">{{ article.tags.first }}</span>{%- endif -%}
          <span class="cg__ct">{{ article.title }}</span>
          <span class="cg__cx">{{ article.excerpt_or_content | strip_html | truncatewords: 18 }}</span>
        </span>
      </a>
    {%- else -%}
      <p class="cg__empty">Guides are on the way.</p>
    {%- endfor -%}
  </div>
</div>

{% stylesheet %}
  /* Port .cg-* styles from approved mockup: .grid/.card/.thumb/.cbody/.ct/.cx/.ctag,
     header (.hero/.eyebrow/.title), responsive 1-col at max-width:749px. Use brand tokens. */
{% endstylesheet %}

{% schema %}
{
  "name": "Guides Hub",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Collector's Guides" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Storage, preservation & collecting, done right" },
    { "type": "textarea", "id": "intro", "label": "Intro line", "default": "Practical guides for protecting and organizing a serious trading card collection." }
  ],
  "presets": []
}
{% endschema %}
```

Note: `blog.articles` is available because this template renders a specific blog. Use the `{% stylesheet %}` tag (Shopify auto-bundles it) matching how the theme's other custom sections scope CSS.

- [ ] **Step 2: Create the blog template that uses the section**

Create `templates/blog.collectors-guides.json`:

```json
{
  "sections": {
    "guides_hub": { "type": "collectors-guides-hub", "settings": {} }
  },
  "order": ["guides_hub"]
}
```

Shopify auto-applies `blog.collectors-guides.json` to the blog whose handle is `collectors-guides` (created in Task 5).

- [ ] **Step 3: Lint**

Run: `shopify theme check sections/collectors-guides-hub.liquid`
Expected: no errors for the new file (pre-existing warnings elsewhere are fine).

- [ ] **Step 4: Commit**

```bash
git add sections/collectors-guides-hub.liquid templates/blog.collectors-guides.json
git commit -m "feat: add Collector's Guides hub section + blog template"
```

Full preview verification happens in Task 7 (needs the blog + articles to exist).

---

## Task 2: Guide article reader (section + suffixed template + Article JSON-LD)

**Files:**
- Create: `sections/guide-article.liquid`
- Create: `templates/article.guide.json`

- [ ] **Step 1: Create the article reader section**

Create `sections/guide-article.liquid`. Port the `.reader` CSS from the mockup, namespaced `.guide-*`. Markup + Liquid + JSON-LD:

```liquid
<article class="guide">
  {%- if article.image -%}
    <div class="guide__head" style="background-image:url('{{ article.image | image_url: width: 1600 }}');"></div>
  {%- endif -%}
  <div class="guide__col">
    <p class="guide__eyebrow"><a href="{{ blog.url }}">{{ blog.title }}</a></p>
    <h1 class="guide__title">{{ article.title }}</h1>
    <p class="guide__meta">{{ article.published_at | date: "%B %e, %Y" }}</p>
    <div class="guide__body rte">{{ article.content }}</div>

    <div class="guide__cta">
      <p>Build a home for your collection.</p>
      <div class="guide__ctabtns">
        <a class="guide__btn guide__btn--p" href="/pages/build-your-cabinet">Configure your cabinet</a>
        <a class="guide__btn guide__btn--o" href="{{ blog.url }}">← All guides</a>
      </div>
    </div>
  </div>
</article>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": {{ article.title | json }},
  {%- if article.image %}"image": [{{ article.image | image_url: width: 1600 | prepend: "https:" | json }}],{% endif %}
  "datePublished": {{ article.published_at | date: "%Y-%m-%dT%H:%M:%SZ" | json }},
  "dateModified": {{ article.updated_at | date: "%Y-%m-%dT%H:%M:%SZ" | json }},
  "author": { "@type": "Organization", "name": {{ shop.name | json }} },
  "publisher": {
    "@type": "Organization",
    "name": {{ shop.name | json }}{% if settings.logo %},
    "logo": { "@type": "ImageObject", "url": {{ settings.logo | image_url: width: 600 | prepend: "https:" | json }} }{% endif %}
  }
}
</script>

{% stylesheet %}
  /* Port .guide-* styles from mockup .reader: centered 720px column, .guide__head image,
     h1/meta, .rte body typography (p/h2/ul/blockquote/img themed), CTA strip reusing button styles. */
{% endstylesheet %}

{% schema %}
{ "name": "Guide Article", "settings": [], "presets": [] }
{% endschema %}
```

Note: `{{ ... | json }}` safely escapes JSON-LD values. The `.rte` class inherits the theme's rich-text typography; the ported CSS tunes it to the dark reader.

- [ ] **Step 2: Create the suffixed article template**

Create `templates/article.guide.json`:

```json
{
  "sections": {
    "guide_article": { "type": "guide-article", "settings": {} }
  },
  "order": ["guide_article"]
}
```

Articles created in Task 6 set `templateSuffix: "guide"` so they render with this template; all other articles keep Dawn's default `article.json`.

- [ ] **Step 3: Lint**

Run: `shopify theme check sections/guide-article.liquid`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add sections/guide-article.liquid templates/article.guide.json
git commit -m "feat: add guide article reader section + suffixed template with Article JSON-LD"
```

---

## Task 3: Polish the About page

**Files:**
- Modify: `sections/about.liquid`

- [ ] **Step 1a: Swap the banner image for the shop-cabinet establishing shot**

In [sections/about.liquid](../../../sections/about.liquid), keep the existing `.about-page__banner` full-width slot but replace its `<img>` (the backstops banner) with the finished-cabinet-in-shop photo — an authenticity/craftsmanship establishing shot directly under the hero:

```liquid
<div class="about-page__banner">
  <img src="{{ 'cabinet-shop-closed-drawer.png' | asset_url }}"
       alt="A finished maple Apex Archive cabinet standing in our workshop, built to order"
       class="about-page__banner-img" width="1200" height="960" loading="lazy">
</div>
```

- [ ] **Step 1b: Add the drawer brand-story feature**

After the banner, add a two-column brand-story feature: drawer image on one side, the intro/story copy on the other. Use `assets/drawer-card-cutout.png`. Port the `.story` layout + radial-glow image treatment from the mockup, keeping the `about-page__` prefix:

```liquid
<div class="about-page__story">
  <div class="about-page__story-img">
    <img src="{{ 'drawer-card-cutout.png' | asset_url }}"
         alt="A maple Apex Archive drawer filled with organized graded slabs and top-loaders in adjustable dividers"
         width="1000" height="700" loading="lazy">
  </div>
  <div class="about-page__story-copy">
    <h2>A storage solution worthy of the collection inside it.</h2>
    <p>The Apex Archive was built around a single obsession: giving serious trading card collectors a home for their collection that protects, preserves, and showcases every graded slab, top-loader, and raw card the way it deserves.</p>
    <p>We build to order — no compromises on size, finish, or configuration. Solid dovetail maple drawer boxes, undermount full-extension soft-close slides, and Stylelite exterior panels in your choice of high-gloss or matte.</p>
    <p>The crown jewel of your collection deserves a home that matches it.</p>
  </div>
</div>
```

Remove the now-duplicated `.about-page__intro` block (its copy moved into the story feature above). Keep the existing `.about-page__hero`.

- [ ] **Step 2: Cohere the value props into a "Why we build this way" grid**

Replace the 2-column `.about-page__body` (intro + vertical values list) with a standalone values section: an eyebrow "Why we build this way" + the value props as a 3-column grid (port `.values-sec` / `.values` / `.value` from the mockup). Keep the 5 existing value items; an optional 6th ("Made to last") may be added to balance the grid.

- [ ] **Step 3: Remove the placeholder testimonial**

Delete the entire `.about-page__testimonials` block (the `— Apex Archive Customer` quote) and its CSS. Per spec: nothing on the page should read as fabricated. A real, styled testimonial section can be re-added later.

- [ ] **Step 4: Add the Collector's Guides teaser (funnel into the hub)**

Before the `.about-page__cta-strip`, add a teaser that pulls the 3 latest guides live from the blog:

```liquid
{%- assign guides = blogs['collectors-guides'] -%}
{%- if guides.articles_count > 0 -%}
<div class="about-page__guides">
  <div class="about-page__guides-head">
    <h2>Collector's Guides</h2>
    <a class="about-page__readall" href="{{ guides.url }}">Read all guides →</a>
  </div>
  <div class="about-page__guides-grid">
    {%- for article in guides.articles limit: 3 -%}
      <a class="about-page__gcard" href="{{ article.url }}">
        {%- if article.image -%}<span class="about-page__gthumb" style="background-image:url('{{ article.image | image_url: width: 600 }}');"></span>{%- endif -%}
        <span class="about-page__gct">{{ article.title }}</span>
        <span class="about-page__gcx">{{ article.excerpt_or_content | strip_html | truncatewords: 14 }}</span>
      </a>
    {%- endfor -%}
  </div>
</div>
{%- endif -%}
```

Port `.guides-sec` / `.card` styling from the mockup as `.about-page__guides*`. The `{% if %}` guard means the section silently hides until the blog has posts — safe to ship before Task 5/6.

- [ ] **Step 5: Lint**

Run: `shopify theme check sections/about.liquid`
Expected: no new errors.

- [ ] **Step 6: Preview the About page**

With `shopify theme dev` running, open http://localhost:9292/pages/about. Confirm: drawer feature renders, value grid is cohesive, no testimonial, CTA intact. (Guides teaser stays hidden until articles exist — verified in Task 7.)

- [ ] **Step 7: Commit**

```bash
git add sections/about.liquid
git commit -m "feat: polish About page — drawer brand-story, cohered values, guides teaser, drop placeholder testimonial"
```

---

## Task 4: Generate + add guide header images

**Files:**
- Create (assets): `assets/guide-graded-slabs.png`, `assets/guide-raw-cards.png`, `assets/guide-environment.png`, `assets/guide-collection-room.png`

Image map (from spec): guide #4 capacity → existing `drawer-card-cutout.png`; guide #6 finish → existing `cabinet-hero-lakeshore-oak.jpg`. Generate the remaining 4.

- [ ] **Step 1: Generate the 4 topic images**

Use the Higgsfield MCP `generate_image` (Soul model), one per guide, on-brand (dark, premium, warm wood, trading cards). Prompts:
- `guide-graded-slabs`: "Premium dark studio photo of PSA/BGS graded trading card slabs stored upright in a warm maple wood drawer divider, soft cinematic lighting, shallow depth of field, luxury feel."
- `guide-raw-cards`: "Premium dark studio flatlay of raw trading cards in penny sleeves and top-loaders neatly arranged on a dark surface, warm accent light, editorial product photography."
- `guide-environment`: "Moody dark interior of a temperature-controlled collection room, subtle warm lighting on a wood storage cabinet, sense of preservation and care, cinematic."
- `guide-collection-room`: "Elegant dark home collection room with a premium maple card-storage cabinet, displayed graded cards, warm ambient lighting, architectural digest style."

Poll `get_generation_status` until complete; download the chosen result.

- [ ] **Step 2: Save into assets**

Save each as the asset filename above (web-sized, ≈1600px wide). Show the owner the generated options before finalizing (owner asked to see them); regenerate or fall back to existing brand photos if any aren't on-brand.

- [ ] **Step 3: Commit**

```bash
git add assets/guide-graded-slabs.png assets/guide-raw-cards.png assets/guide-environment.png assets/guide-collection-room.png
git commit -m "feat: add generated header images for collector guides"
```

Note final asset filenames — Task 6 references them when setting each article image.

---

## Task 5: Create the Collector's Guides blog

- [ ] **Step 1: Create the blog via Shopify MCP**

Use `mcp__claude_ai_Shopify__graphql_mutation` with `blogCreate`:

```graphql
mutation { blogCreate(blog: { title: "Collector's Guides", handle: "collectors-guides" }) {
  blog { id handle } userErrors { field message } } }
```

Expected: returns a blog `id` (gid) and `handle: "collectors-guides"`, empty `userErrors`. Record the blog `id` for Task 6.

- [ ] **Step 2: Verify template binding**

With `shopify theme dev` running, open http://localhost:9292/blogs/collectors-guides. Expected: the hub renders the header + "Guides are on the way." empty state (no articles yet), styled per Task 1.

---

## Task 6: Write + publish the 6 cornerstone guides

**Per-article requirements (all 6):** ~1,500–2,500 words; one `<h1>` (the title) handled by the template, body uses `<h2>` sub-sections; **each `<h2>` section opens with a clear question→direct-answer passage** (for AI Overviews); semantic HTML body (`<p>`, `<h2>`, `<ul>`, `<blockquote>`); **2–3 internal links** to `/pages/build-your-cabinet` (or relevant collection) + 1–2 sibling guides; custom SEO meta description; 2–4 tags (first tag shows on the hub card); `templateSuffix: "guide"`; `image` set; **all factual claims researched for accuracy** (real PSA/BGS/CGC slab dimensions, archival/material facts, safe humidity ~40–50% RH and temperature ranges) — research with WebSearch before writing, cite nothing fabricated.

Article briefs (title · handle · first tag · image · primary internal link):

1. **How to store graded cards (PSA / BGS / CGC slabs) the right way** · `store-graded-cards` · "Graded cards" · `guide-graded-slabs.png` · → configurator. H2s: why slab storage differs / upright vs stacked / materials that protect / environment (link guide 3) / capacity (link guide 4).
2. **Protecting raw cards: penny sleeves, top-loaders & what actually works** · `protecting-raw-cards` · "Raw cards" · `guide-raw-cards.png` (RESERVED: swap for the owner's incoming "cards in shoe boxes" photos when available — they're the literal "before" this guide solves; use the generated placeholder until then) · → configurator. H2s: sleeve types / top-loader vs one-touch / what's overkill / organizing for retrieval.
3. **Humidity, light & temperature — the silent enemies of a card collection** · `humidity-light-temperature` · "Preservation" · `guide-environment.png` · → configurator. H2s: safe RH range / temperature / UV light / where to store (link guide 5).
4. **How many cards can you actually store? Slab vs. top-loader capacity planning** · `card-storage-capacity` · "Capacity" · `drawer-card-cutout.png` · → configurator. H2s: slab vs raw footprint / per-drawer math / sizing your cabinet (link configurator).
5. **Building a collection room: display vs. long-term storage** · `building-a-collection-room` · "Setup" · `guide-collection-room.png` · → configurator. H2s: display vs archive / furniture choices / environment (link guide 3) / scaling the collection.
6. **Choosing the right cabinet finish & configuration for your collection** · `choosing-cabinet-finish` · "Buying guide" · `cabinet-hero-lakeshore-oak.jpg` · → configurator. H2s: finishes (gloss vs matte) / divider configuration (link guide 4) / sizes / how to start a build (link configurator).

- [ ] **Step 1: Research facts**

For each article, run targeted `WebSearch` queries to confirm dimensions, RH/temperature ranges, and material claims. Capture sources; do not invent specifics.

- [ ] **Step 2: Create each article via MCP**

For each of the 6, use `mcp__claude_ai_Shopify__graphql_mutation` with `articleCreate` (or the current Admin API article mutation — verify with `graphql_schema` first):

```graphql
mutation {
  articleCreate(article: {
    blogId: "<blog gid from Task 5>",
    title: "<title>",
    handle: "<handle>",
    body: "<full semantic HTML body>",
    isPublished: true,
    tags: ["<tag1>", "..."],
    templateSuffix: "guide",
    summary: "<short excerpt>",
    image: { url: "<published asset URL for the image>" },
    metafields: []  // SEO meta description via the article's seo field if exposed; else set in Admin
  }) { article { id handle } userErrors { field message } }
}
```

If the article mutation doesn't accept an asset URL directly, upload the image first or set the featured image + SEO meta description in Admin after creation. Verify the exact mutation shape with `graphql_schema` before running.

Expected per call: returns article `id`/`handle`, empty `userErrors`.

- [ ] **Step 3: Verify each article renders**

For each, open `http://localhost:9292/blogs/collectors-guides/<handle>`. Expected: guide reader template (Task 2), header image, body formatting, internal links work, CTA + "All guides" link work, JSON-LD present in page source.

---

## Task 7: End-to-end wiring + verification

- [ ] **Step 1: Verify the hub grid**

Open http://localhost:9292/blogs/collectors-guides. Expected: 6 cards, each with image, first-tag label, title, excerpt; cards link to the right articles; 1-column on mobile (≤749px).

- [ ] **Step 2: Verify the About teaser funnel**

Open http://localhost:9292/pages/about. Expected: the Collector's Guides teaser now shows (3 latest guides), "Read all guides →" links to the hub, cards link to articles.

- [ ] **Step 3: Validate structured data**

Open an article, view source, copy the `Article` JSON-LD into Google's Rich Results Test (or `https://validator.schema.org/`). Expected: valid Article, no errors.

- [ ] **Step 4: Full lint + broken-image check**

Run: `shopify theme check`
Expected: no new errors from the added files. In devtools Network tab on the hub + an article + About, confirm zero image 404s.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: wire About → guides hub funnel; complete guides hub end-to-end"
```

Do not merge `feature/guides-hub` → `main` (which deploys live) until the owner reviews and approves.

---

## Out of scope (handoff checklist items, not built here)

Add to the store-owner handoff checklist: verify domain in **Google Search Console** + submit the auto-generated sitemap; publish **2–4 quality guides/month**; earn **genuine backlinks** (collector communities, reviews) — never paid/link-farm links. Re-add a real customer testimonial once available. Add tag-filter UI / pagination to the hub only when the library outgrows one screen.
