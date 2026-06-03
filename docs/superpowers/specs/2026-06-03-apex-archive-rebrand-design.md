# The Apex Archive — Full Site Rebrand Design

**Date:** 2026-06-03
**Status:** Approved for implementation planning

---

## Context

The Oxford Wood Works Shopify store has been acquired by a new buyer who is rebranding it as **The Apex Archive** — a premium trading card storage cabinet company. The buyer liked the overall site structure and the existing "Build Your Cabinet" configurator, so the approach is a section-by-section rebrand that preserves layout and functionality while completely replacing brand identity and content.

The buyer's aesthetic: *clean, rustic but cutting edge* — vintage collector culture meets premium craftsmanship.

---

## What Changes vs What Stays

### Kept (with updates)
- Dawn theme infrastructure
- Header layout (logo position, nav structure)
- Hero section layout (full-width image/video banner, centered text)
- Build Your Cabinet configurator — Section 1 (colors, images, and copy updated)
- Features/about sections (content replaced for trading cards)
- Order form (rebranded)
- Footer

### Archived locally (removed from live site)
- Door profiles page (`sections/door-profiles.liquid` and related assets)
- Build Your Cabinet 2 configurator (`sections/cabinet-configurator-3d.liquid` or equivalent)

These files must be copied to a local backup folder **before any changes are made**. They are not to be deleted from the machine — just removed from the live theme.

### Replaced entirely
- All Oxford Wood Works branding (logo, name, colors)
- All page copy and product content (MDF doors → trading card cabinets)
- Product catalog

---

## Brand Identity

### Logo
- **Source:** PNG from The Apex Archive Instagram — circular badge design with ornate scroll/flourish and ribbon banner reading "THE APEX ARCHIVE"
- **Treatment:** Circular badge/seal — the cream circle is intentional, creates a wax-seal stamp look against dark backgrounds
- **Placement:** Left-aligned in header (current logo position), inline with nav
- **File to create:** `assets/apex-archive-logo.png` (save from Instagram source)
- **All existing logo references** (`oxford-wood-works-logo.svg`, `oxford-wood-works-logo.png`) replaced with this file

### Color Palette — Dark Warm (Option C)

| Token | Value | Notes |
|-------|-------|-------|
| Background | `#1e1410` | Warm dark brown-black (replaces cool `#1c1c1c`) |
| Secondary/cards | `#2c1e12` | Warm dark brown (replaces `#242424`) |
| Heading text | `#f0ede8` | Keep — warm cream |
| Body text | `#b5a898` | Slightly warmer than current `#d4cfc9` |
| Accent/gold | `#c9a96e` | Keep |
| Borders | `#3d2a18` | Warm brown (replaces cool `#2e2e2e`) |
| Parchment accent | `#e8dfc8` | NEW — used for section header strips, announcement bar, horizontal rules |
| Parchment text | `#5a3e28` | NEW — dark warm brown, used on parchment strips |

### Typography
- Body: Inter (keep — clean geometric sans)
- Consider: Georgia or similar serif for hero headline and section headings only — gives the vintage editorial feel without requiring a font import. Decision deferred to implementation.

### Design Motifs
- Parchment accent strips: thin horizontal `#e8dfc8` bars used to separate major sections (like the announcement bar and footer divider)
- Gold ornamental dividers: `✦` character in `#c9a96e` used sparingly between tagline elements
- Letter-spacing: generous on all caps labels (2–3px) — already established in current site

---

## Section Build Order

Work through each section completely (brand + content + layout) before moving to the next.

### 1. Pre-work: Archiving
- Copy `sections/door-profiles.liquid` + related assets to local backup
- Copy `sections/cabinet-configurator-3d.liquid` (Cabinet 2) to local backup
- Create new git branch: `apex-archive-rebrand`

### 2. Header & Footer
- Upload `apex-archive-logo.png` to assets via git
- Update all logo file references in `blocks/_header-logo.liquid`, `blocks/logo.liquid`
- Update `sections/order-form.liquid` logo reference, alt text, and branding text
- Update `sections/footer-group.json` block ID from `logo_oxford` to `logo_apex`
- Update announcement bar copy (parchment strip style)
- Apply new color palette to `config/settings_data.json`

### 3. Hero Section
- Keep current full-width banner layout exactly as-is
- Update hero headline copy → Apex Archive tagline ("The Crown Jewel of Your Collection")
- Update hero subtext → trading card cabinet pitch
- Hero image: placeholder until buyer provides product photography (use a dark branded holding image)
- Update CTA button labels ("Shop Cabinets", "Configure Yours")

### 4. Features / About Strip
- Replace Oxford Wood Works brand story with Apex Archive story
- Replace product feature callouts with the 5 selling points from the flyer:
  1. Masterful Craft — solid dovetail maple drawer boxes
  2. High-Tech Finishes — Stylelite exterior panels, high-gloss or matte
  3. Precision Hardware — Blum Movento undermount soft-close slides
  4. Total Customization — adjustable 1/2" plywood dividers
  5. Massive Capacity — 3,400+ PSA slabs or 11,200+ Top-Loaders
- Update testimonials section (remove Oxford Wood Works references)

### 5. Build Your Cabinet Configurator (Section 1)
- Update all color values to new warm dark palette
- Replace any Oxford Wood Works branded images/logos within the configurator UI
- Update copy/labels for trading card cabinet options (drawer counts, sizes, finishes)
- Keep all functional JavaScript/Liquid logic intact

### 6. Order Form
- Update store name from "Oxford Wood Works" / "OXFORD WOOD WORKS" to "The Apex Archive"
- Update URL reference from `oxfordwoodworks.com` to Apex Archive domain (TBD — use placeholder)
- Update logo, alt text, footer text

### 7. Remove Archived Pages
- Remove door profiles page from navigation
- Remove Cabinet 2 from navigation
- Ensure no broken links remain

### 8. CLAUDE.md Update
- Update project name, client name, store URL, color palette documentation

---

## Content Notes

The flyer copy is the best available source for Apex Archive messaging. Use it as the basis for all copy until the buyer provides branded content:

- **Tagline:** "The Crown Jewel of Your Collection"
- **Subheading:** "Designed for the serious collector. Protect, preserve, and showcase your priceless graded slabs, top-loaders, and accessories with artisanal-grade craftsmanship."
- **Email:** ApexCardArchive@gmail.com (from flyer)
- **Sizes:** "Many sizes available" — specific models TBD by buyer

---

## Logo File Locations to Update

All these references need updating from `oxford-wood-works-logo.svg` → `apex-archive-logo.png`:

| File | What to change |
|------|---------------|
| `blocks/_header-logo.liquid` | `src` fallback on line ~69 |
| `blocks/logo.liquid` | Fallback filename check + src on line ~66–69 |
| `sections/order-form.liquid` | `src` line ~18, `alt` line ~19, URL line ~24, footer text line ~168 |

---

## Files to Archive Locally (Before Any Changes)

| File | Save to |
|------|---------|
| `sections/door-profiles.liquid` | Local backup folder on user's machine |
| Cabinet 2 configurator section | Local backup folder on user's machine |
| Any door-profiles-specific assets | Local backup folder on user's machine |

---

## Verification

After implementation, verify:
1. Logo appears correctly in header, order form, and any other location
2. New color palette renders consistently across all pages
3. Configurator loads and functions correctly with new colors
4. Door profiles page and Cabinet 2 are inaccessible from the live site
5. No broken links or missing images
6. `shopify theme dev` shows the correct branding throughout
7. Git history is clean on the `apex-archive-rebrand` branch
8. CLAUDE.md reflects the new project identity
