---
title: Cabinet Shop Service — Brand Kit Tier System Design
date: 2026-05-08
status: approved
session: brainstorming
---

# Brand Kit Tier System — Design Spec

## What We're Building

A tiered brand asset delivery system layered on top of the existing 5-tier cabinet shop website service. Clients at Tier 3 and above receive a professionally designed and delivered brand kit as part of their package. Tiers 1–2 remain implementation-only — the client supplies their own brand assets and we build the site around them.

This spec covers:
- What brand assets are included at each tier
- How assets are created
- How assets are delivered
- The folder structure used for every client handoff

---

## Decisions Made

### Structure: Tier-Gated (Option B — "The Brand Jump")

Brand creation begins at Tier 3. This was chosen because:
- Tiers 1–2 stay lean, fast to deliver, and competitively priced
- Tier 3 becomes the "wow moment" that justifies the price jump from ~$3,500 to ~$6,500
- Matches how top Shopify Expert agencies and high-end web studios package brand work
- Doing logo design at Tier 2 pricing (~$3,500) undervalues the work and doesn't leave room for revisions

Tiers 1–2 include a custom favicon as the only brand deliverable (client supplies everything else).

### Creation Method: Mixed — AI-Assisted + Manual Digital Drawing

Logo and brand assets are created using a combination of:
- AI generation tools (Midjourney, Adobe Firefly, Looka, etc.) for initial concepts
- Manual refinement using a digital drawing program
- No single tool is mandated — the method should suit the client brief

### Delivery Model: Managed Service + Optional ZIP

- **Standard (all tiers):** Assets are implemented directly on the client's Shopify site. No technical knowledge required from the client.
- **IT Handoff (Tier 5):** A complete ZIP archive in the standard folder structure is provided for clients with in-house IT teams who want to take over asset management.

---

## Brand Kit Contents by Tier

### Tier 1 (~$2,000) — Shell
**Brand deliverable: Favicon only**
- Client supplies all other brand assets (logo, colours, fonts)
- We implement what they provide

### Tier 2 (~$3,500) — Smart Quote
**Brand deliverable: Favicon + implementation**
- Client supplies all brand assets
- We implement their existing logo and colour scheme on the site
- Custom favicon created

### Tier 3 (~$6,500) — Live Estimator ✦ Brand Kit Begins
**Brand deliverable: Brand Essentials**
- Primary logo (horizontal / long form)
- Condensed logo (vertical / short form)
- Icon mark (standalone symbol)
- Custom favicon (.ico + .png)
- Hex colour palette (6 brand colours)
- 5 × social media post templates (1080×1080 + 1200×630)
- All assets delivered in SVG + PNG format

### Tier 4 (~$10,000) — Full E-Commerce
**Brand deliverable: Extended Brand Kit**
- Everything in Tier 3
- 15 × social media post templates
- Social profile image set (sized for all major platforms)
- Email signature template (HTML)
- Branded thumbnail pack (YouTube / web, 1280×720)
- White + black logo variants
- All assets in SVG + PNG + PDF

### Tier 5 (~$14,000) — Trade & Pro Portal
**Brand deliverable: Brand Identity System**
- Everything in Tier 4
- Brand guidelines PDF (print-ready)
- CSS design system documentation
- Typography hierarchy defined
- Button & UI component style guide
- Ongoing brand asset management
- ZIP archive delivery for IT team handoff

---

## Deliverable Folder Structure

Every brand kit is delivered in this folder structure, regardless of tier. Lower tiers simply have fewer populated folders.

```
ClientName_BrandKit/
├── 00_Brand_Guidelines/
│   └── ClientName_BrandGuidelines.pdf          ← Tier 5 only
│
├── 01_Logos/
│   ├── Primary/       ← horizontal / long form
│   ├── Condensed/     ← vertical / short form
│   └── Icon_Mark/     ← standalone symbol
│       (Each subfolder: full-colour, white, black — SVG + PNG + PDF)
│
├── 02_Colour_Palette/
│   └── ClientName_Colours.pdf                  ← hex, RGB, CMYK swatches
│
├── 03_Favicon/
│   ├── favicon.ico
│   ├── favicon-32x32.png
│   └── favicon-180x180.png
│
├── 04_Social_Media/
│   ├── Post_Templates/    ← 1080×1080 + 1200×630
│   ├── Profile_Images/    ← sized per platform
│   └── Thumbnails/        ← YouTube / web (1280×720)
│
└── 05_Extras/             ← email signature, CSS design system doc (Tier 5)
```

**Naming convention:** `ClientName_AssetType_Variant.ext`
Example: `OxfordWoodWorks_Logo_Primary_Colour.svg`

---

## Positioning Notes

- **"Buttons" in social context** (per Phill Anton's suggestion): social media icon/button assets and post templates. CSS button components on the website are part of the site build itself — deliberately documenting them as a design system handoff is a Tier 5 deliverable.
- **"Thumbnails"** refers to YouTube and web thumbnails (1280×720), plus social media sized variants. Product thumbnails for the Shopify storefront are part of the website tier, not the brand kit.
- This brand kit structure was developed in collaboration with Phill Anton and is being used as the template for the broader cabinet shop website service offering.

---

## Client-Facing Presentation

A polished client-facing presentation has been generated and saved:

| File | Purpose |
|------|---------|
| `docs/phillanton-brand-packages-presentation.html` | Branded HTML — Phill Anton colour scheme |
| `docs/Phill_Anton_Website_Brand_Packages.pdf` | PDF for email delivery to Phill Anton |
| `docs/brand-packages-presentation.html` | Oxford Wood Works branded version (internal reference) |

---

## Open Questions

- [ ] Final prices for each tier to be confirmed with Phill Anton
- [ ] AI tool workflow to be documented once a preferred stack is settled on
- [ ] Canva vs Figma for social media template creation — TBD
- [ ] Whether to offer the brand kit as an add-on to Tier 1–2 clients at a flat fee in future
