# Door Profiles Page — Design Spec
**Date:** 2026-05-05
**Project:** Oxford Wood Works

---

## Overview

A dedicated gallery page at `/pages/door-profiles` showcasing 6 CNC-cut MDF door designs licensed from phillanton.com. Customers browse the profiles and click "Get a Quote" to be taken to a placeholder quote page. No cart or pricing — the page is a catalog, not a checkout flow. The quote page is a placeholder for a future price calculator (Phase 3).

---

## Files to Create

| File | Purpose |
|------|---------|
| `templates/page.door-profiles.json` | Page template wiring up the door-profiles section |
| `sections/door-profiles.liquid` | The gallery section (header + grid + footer note) |
| `templates/page.quote.json` | Template for the quote placeholder page |
| `sections/quote-placeholder.liquid` | Simple "coming soon" section for the quote page |

No existing files are modified except the Shopify admin (to create the two new pages and assign templates — done manually).

---

## Door Profiles — Data

The first 6 profiles from phillanton.com. These are hardcoded in the section Liquid.

| Code | Name | Expected image asset |
|------|------|----------------------|
| S001 | Shaker | `door-s001.jpg` |
| S002 | Bevel Shaker | `door-s002.jpg` |
| S003 | Double Shaker | `door-s003.jpg` |
| S004 | Slim Shaker | `door-s004.jpg` |
| S005 | Skinny 150V | `door-s005.jpg` |
| S006 | Skinny Bead 125 | `door-s006.jpg` |

Images are **not included in this phase**. The section renders a styled dark placeholder when the asset is missing. When the owner uploads a recolored image with the correct filename to Shopify Admin → Content → Files, it will appear automatically — no code changes needed.

---

## Page Layout — `sections/door-profiles.liquid`

### Page Header
- Small gold eyebrow label: `Our Range`
- H1: `Door Profiles`
- Subtitle paragraph: `CNC-cut MDF doors machined to precision. Each profile is available in custom sizes and finishes — select a design and request a quote to get started.`
- Bottom border separating header from grid

### Profile Grid
- `display: grid`, `grid-template-columns: repeat(3, 1fr)`, `gap: 1px`, `background: #2e2e2e` (border colour — gaps between cards appear as border lines)
- 6 cards rendered via a Liquid `for` loop over a hardcoded array

### Each Profile Card
```
┌─────────────────────────┐
│                         │
│    [Image or placeholder│
│       200px tall]       │
│                         │
├─────────────────────────┤
│ S001              [Get a│
│ Shaker             Quote│
│                       ] │
└─────────────────────────┘
```
- **Image area** (200px height): `<img>` tag pointing to `{{ 'door-s001.jpg' | asset_url }}` with `style="display:none"` and a sibling `<div class="img-placeholder">` visible by default. JavaScript (or CSS `img[src]:not([src=""])`) shows the `<img>` and hides the placeholder once the image loads successfully. This ensures no broken-image icon ever appears. Wrapper `<div>` background: `#111`, `object-fit: cover`, `width: 100%`, `height: 100%`.
- **Card footer** (flex row, space-between):
  - Left: profile code (gold, 0.6rem, uppercase, tracked) + profile name (cream, 0.88rem)
  - Right: "Get a Quote" button — outline style, links to `/pages/quote`

### Footer Note
- Below the grid, centered, muted text: `Looking for a profile not listed here? Contact us — more designs available on request.`
- "Contact us" links to `/pages/contact`

### Responsive behaviour
- Desktop (≥990px): 3 columns
- Tablet (750–989px): 2 columns
- Mobile (<750px): 1 column, full-width cards

---

## Quote Placeholder Page — `sections/quote-placeholder.liquid`

Simple centred section:
- Eyebrow: `Coming Soon`
- H1: `Request a Quote`
- Body: `Our pricing calculator is on its way. In the meantime, get in touch directly and we'll work out a price based on your door size, profile, and finish.`
- Primary CTA button: `Contact Us` → `/pages/contact`

This section is intentionally minimal — it will be replaced entirely when the Phase 3 calculator is built.

---

## Color & Style Tokens (from design system)

| Token | Value |
|-------|-------|
| Background | `#1c1c1c` |
| Card background | `#242424` (image placeholder bg: `#111`) |
| Border / grid gap | `#2e2e2e` |
| Heading text | `#f0ede8` |
| Body / muted text | `#d4cfc9` |
| Gold accent | `#c9a96e` |
| Button: outline style | `border: 1px solid rgba(240,237,232,0.35)`, `color: #f0ede8` |
| Button hover | `border-color: #c9a96e`, `color: #c9a96e` |

No gradients, no shadows, no decorative borders. Consistent with the rest of the theme.

---

## Adding Images Later (Owner Instructions)

When recolored door images are ready:
1. Go to Shopify Admin → Content → Files
2. Upload each image with the exact filename (e.g. `door-s001.jpg`)
3. The image will appear on the page immediately — no code changes needed

Images should be: minimum 800×1100px, portrait orientation, JPEG, showing the door on a dark (#1c1c1c) background with the brand palette applied.

---

## Out of Scope (Phase 3)

- Price calculator / configurator
- Size/finish variant selection
- Cart or checkout flow
- More than 6 profiles (add more later by extending the Liquid array)
