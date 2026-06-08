# Animated Cabinet Hero Slideshow — Design

**Date:** 2026-06-08
**Status:** Approved
**Scope:** `sections/homepage-hero.liquid`, `templates/index.json`

## Goal

Replace the homepage hero's single static CNC background image with an
auto-cycling slideshow of the cabinet finish images, using a Ken Burns
(slow zoom/pan) effect with a crossfade between slides. The hero's text,
eyebrow, headline, sub-head, and CTA buttons are unchanged — only the
background behind them animates.

## Decisions

- **Motion:** Ken Burns (slow scale/drift) on the active slide + crossfade
  dissolve between slides. Zoom direction alternates per slide for variety.
- **Image management:** Slides are Shopify theme **section blocks**, managed
  in the Customizer (add / remove / reorder, no code).
- **Image source:** Each block has a **filename text field** pointing at a
  file in `/assets` (e.g. `cabinet-hero-walnut.jpg`), resolved via
  `asset_url`. This preserves the existing git-based image workflow.

## Markup

The single `.homepage-hero__bg` div is replaced by a slide stack:

```
.homepage-hero__slides            (absolute, full-bleed container)
  .homepage-hero__slide           (one per block; handles opacity crossfade)
    .homepage-hero__slide-img     (background-image; handles Ken Burns transform)
.homepage-hero__fade              (existing dark gradient — unchanged, stays on top)
.homepage-hero__content           (existing text/CTAs — unchanged)
```

Splitting opacity (slide) from transform (slide-img) keeps the crossfade and
the Ken Burns animation on separate elements so they never fight.

## Behaviour

- **Cycling:** Vanilla JS scoped to the section. On each tick the `is-active`
  class moves to the next slide. Interval = section `slide_duration` setting.
- **Ken Burns:** A CSS keyframe animation (scale ~1.0→1.12 with slight drift)
  runs on `.homepage-hero__slide-img`. It is `paused` by default and `running`
  only while the parent slide is `is-active`, so motion continues smoothly
  without restart flashes. `:nth-child(even)` slides zoom out instead of in.
- **Crossfade:** `.homepage-hero__slide` transitions `opacity` (~1.2s ease).
  Active = opacity 1, others = opacity 0.

## Schema

**Section settings**
- `slide_duration` — range, 4–10s, step 1, default 6 (seconds each slide shows).
- `enable_ken_burns` — checkbox, default true.

**Block** (`type: "slide"`, `name: "Cabinet image"`, max_blocks: 20)
- `image_filename` — text — `/assets` filename (e.g. `cabinet-hero-walnut.jpg`).
- `label` — text — optional editor-only name to identify the slide.

**Pre-loaded slides** are defined directly in `templates/index.json` so the
slideshow works on deploy with zero manual setup. Order:
`cabinet-hero-main`, then maple, walnut, black, white, mdf, wired-mercury,
lakeshore-oak, acquedotti.

## Edge cases

- **0 slides / 0 valid:** Fall back to the current `cnc-hero` image so the
  hero is never empty.
- **1 slide:** Render static (with optional Ken Burns); no JS cycling.
- **Bad/typo filename:** `asset_url` yields a broken URL for that one slide;
  it shows nothing and cycling continues. Does not break the page.
- **`prefers-reduced-motion`:** Ken Burns transform disabled; calm crossfade
  (or static) retained.
- **Accessibility:** Slide layers are decorative — `aria-hidden="true"`.

## Out of scope

- No navigation dots / arrows / manual controls (it is a passive background).
- No changes to hero copy or CTAs.
- No new image assets created in this task (uses existing `cabinet-hero-*`).

## Adding a finish later

1. Add the image file to `/assets` via git.
2. In Customize → Homepage Hero, duplicate a slide block and type the filename.
   No code change required.
