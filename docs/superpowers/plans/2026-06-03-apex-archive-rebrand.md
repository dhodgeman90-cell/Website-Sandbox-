# Apex Archive — Full Site Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the Oxford Wood Works Shopify theme to The Apex Archive — a premium trading card storage cabinet company — replacing all brand identity, copy, and content while preserving the site's layout, structure, and the Build Your Cabinet configurator.

**Architecture:** Section-by-section complete overhaul on a dedicated git branch. Each section is fully finished (brand + content + layout) before moving to the next. Files for Door Profiles and Cabinet Configurator 2 are archived locally before any changes are made.

**Tech Stack:** Shopify Dawn theme, Liquid, JSON theme settings, Git. Local preview via `shopify theme dev --store ywbx1x-1n.myshopify.com`.

**Design spec:** `docs/superpowers/specs/2026-06-03-apex-archive-rebrand-design.md`

---

## Color Reference

| Token | Old value | New value |
|-------|-----------|-----------|
| Background (primary) | `#000000` | `#1e1410` |
| Background (secondary) | `#0f0f0f` | `#2c1e12` |
| Borders | `#2a2a2a` | `#3d2a18` |
| Body text | `#cccccc` | `#b5a898` |
| Heading text | `#ffffff` | `#f0ede8` |
| Accent/gold | `#c9a96e` | `#c9a96e` (unchanged) |
| Parchment strip bg | _(new)_ | `#e8dfc8` |
| Parchment strip text | _(new)_ | `#5a3e28` |

---

## Task 0: Pre-flight — Archive files and create branch

**Files:**
- Archive: `sections/door-profiles.liquid` → local backup folder
- Archive: `sections/cabinet-configurator-3d.liquid` → local backup folder

- [ ] **Step 1: Create a local backup folder**

Open PowerShell and run:
```powershell
New-Item -ItemType Directory -Path "C:\Users\dhodg\Documents\OxfordWoodWorks-Archive" -Force
```

- [ ] **Step 2: Copy the door profiles section to backup**

```powershell
Copy-Item "c:\VS Code\Website Fuckery\sections\door-profiles.liquid" "C:\Users\dhodg\Documents\OxfordWoodWorks-Archive\door-profiles.liquid"
```

- [ ] **Step 3: Copy Cabinet Configurator 2 to backup**

```powershell
Copy-Item "c:\VS Code\Website Fuckery\sections\cabinet-configurator-3d.liquid" "C:\Users\dhodg\Documents\OxfordWoodWorks-Archive\cabinet-configurator-3d.liquid"
```

- [ ] **Step 4: Verify both files are in the backup folder**

```powershell
Get-ChildItem "C:\Users\dhodg\Documents\OxfordWoodWorks-Archive"
```
Expected: Two files listed — `door-profiles.liquid` and `cabinet-configurator-3d.liquid`

- [ ] **Step 5: Create the rebrand git branch**

```powershell
git checkout -b apex-archive-rebrand
```
Expected: `Switched to a new branch 'apex-archive-rebrand'`

- [ ] **Step 6: Verify you are on the new branch**

```powershell
git branch
```
Expected: `* apex-archive-rebrand` shown with an asterisk

---

## Task 1: Add Apex Archive logo to assets

**Files:**
- Create: `assets/apex-archive-logo.png`

- [ ] **Step 1: Save the logo PNG to assets**

The logo image is a circular badge design from The Apex Archive Instagram. Save the PNG file to:
```
c:\VS Code\Website Fuckery\assets\apex-archive-logo.png
```
The file must be named exactly `apex-archive-logo.png`.

> **How:** Right-click the Instagram logo image → Save image as → navigate to `c:\VS Code\Website Fuckery\assets\` → name it `apex-archive-logo.png`

- [ ] **Step 2: Verify the file exists**

```powershell
Test-Path "c:\VS Code\Website Fuckery\assets\apex-archive-logo.png"
```
Expected: `True`

- [ ] **Step 3: Commit the logo**

```powershell
git add assets/apex-archive-logo.png
git commit -m "feat: add Apex Archive logo PNG"
```

---

## Task 2: Update color palette in settings_data.json

**Files:**
- Modify: `config/settings_data.json`

The `current` section of this file controls live theme colors. Schemes 1 and 2 are the primary dark backgrounds. Update both to warm brown tones.

- [ ] **Step 1: Update scheme-1 background and borders**

In `config/settings_data.json`, find the `"scheme-1"` block inside `"current"` (around line 78). Change these values:

```json
"background": "#1e1410",
"foreground_heading": "#f0ede8",
"foreground": "#b5a898",
"primary": "#f0ede8",
"primary_hover": "#c9a96e",
"border": "#3d2a18",
```

- [ ] **Step 2: Update scheme-1 button colors to gold**

In the same scheme-1 block, update primary button colors:

```json
"primary_button_background": "#c9a96e",
"primary_button_text": "#1e1410",
"primary_button_border": "#c9a96e",
"primary_button_hover_background": "#b8944f",
"primary_button_hover_text": "#1e1410",
"primary_button_hover_border": "#b8944f",
```

And secondary button colors:

```json
"secondary_button_text": "#c9a96e",
"secondary_button_border": "#c9a96e",
"secondary_button_hover_background": "rgba(201,169,110,0.08)",
"secondary_button_hover_text": "#c9a96e",
"secondary_button_hover_border": "#c9a96e",
```

- [ ] **Step 3: Update scheme-2 background and borders**

Find the `"scheme-2"` block inside `"current"` (around line 117). Change:

```json
"background": "#2c1e12",
"foreground_heading": "#f0ede8",
"foreground": "#b5a898",
"border": "#3d2a18",
```

- [ ] **Step 4: Update input field colors in both schemes to match warm palette**

In scheme-1, update:
```json
"input_background": "#2c1e12",
"input_text_color": "#b5a898",
"input_border_color": "#3d2a18",
"input_hover_background": "#3d2a18",
```

In scheme-2, update:
```json
"input_background": "#1e1410",
"input_text_color": "#b5a898",
"input_border_color": "#3d2a18",
```

- [ ] **Step 5: Start local preview and verify colors look correct**

```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```

Open http://localhost:9292 in your browser. The background should now have a warm dark brown tone instead of cool black. Scroll through the homepage and check that text is readable.

- [ ] **Step 6: Commit color palette changes**

```powershell
git add config/settings_data.json
git commit -m "feat: apply Apex Archive warm dark color palette"
```

---

## Task 3: Update logo file references in theme blocks

**Files:**
- Modify: `blocks/_header-logo.liquid` (line 69)
- Modify: `blocks/logo.liquid` (line 66–73)

- [ ] **Step 1: Update the fallback logo in _header-logo.liquid**

In `blocks/_header-logo.liquid`, find lines 67–74 (the `{% else %}` branch):

```liquid
    {% else %}
      <img
        src="{{ 'oxford-wood-works-logo.svg' | asset_url }}"
        alt="{{ shop.name }}"
        class="header-logo__image"
        style="height: 60px; width: auto; display: block;"
      >
    {% endif %}
```

Replace with:

```liquid
    {% else %}
      <img
        src="{{ 'apex-archive-logo.png' | asset_url }}"
        alt="{{ shop.name }}"
        class="header-logo__image"
        style="height: 60px; width: auto; display: block; border-radius: 50%;"
      >
    {% endif %}
```

- [ ] **Step 2: Update the fallback logo in logo.liquid**

In `blocks/logo.liquid`, find lines 66–77 (the `{% elsif %}` branch):

```liquid
  {% elsif 'oxford-wood-works-logo.svg' != blank %}
    <div class="logo-block__image-wrapper">
      <img
        src="{{ 'oxford-wood-works-logo.svg' | asset_url }}"
        alt="{{ shop.name }}"
        class="logo-block__image"
        style="height: 70px; width: auto;"
      >
    </div>
```

Replace with:

```liquid
  {% elsif 'apex-archive-logo.png' != blank %}
    <div class="logo-block__image-wrapper">
      <img
        src="{{ 'apex-archive-logo.png' | asset_url }}"
        alt="{{ shop.name }}"
        class="logo-block__image"
        style="height: 70px; width: auto; border-radius: 50%;"
      >
    </div>
```

- [ ] **Step 3: Verify logo appears in header**

With `shopify theme dev` still running, open http://localhost:9292. The Apex Archive circular logo badge should appear in the header. If the theme has a logo configured in Shopify admin settings, that will take priority — that's correct behavior.

- [ ] **Step 4: Commit logo reference changes**

```powershell
git add blocks/_header-logo.liquid blocks/logo.liquid
git commit -m "feat: replace Oxford Wood Works logo references with Apex Archive"
```

---

## Task 4: Update the order form branding

**Files:**
- Modify: `sections/order-form.liquid` (lines 17–29 and 167–170)

- [ ] **Step 1: Update order form header — logo, URL, and subtitle**

In `sections/order-form.liquid`, find lines 14–30 (the `HEADER` section):

```liquid
    <!-- ── HEADER ─────────────────────────────────────── -->
    <div class="oww-form-header">
      <div class="oww-form-header__logo-wrap">
        <img
          src="{{ 'oxford-wood-works-logo.svg' | asset_url }}"
          alt="Oxford Wood Works"
          class="oww-form-header__logo"
          width="160"
          height="42"
        >
        <p class="oww-form-header__url">oxfordwoodworks.com</p>
      </div>
      <div class="oww-form-header__title-wrap">
        <p class="oww-form-header__order-label">ORDER FORM</p>
        <p class="oww-form-header__sub">CNC-CUT MDF DOORS</p>
      </div>
    </div>
```

Replace with:

```liquid
    <!-- ── HEADER ─────────────────────────────────────── -->
    <div class="oww-form-header">
      <div class="oww-form-header__logo-wrap">
        <img
          src="{{ 'apex-archive-logo.png' | asset_url }}"
          alt="The Apex Archive"
          class="oww-form-header__logo"
          width="60"
          height="60"
          style="border-radius: 50%;"
        >
        <p class="oww-form-header__url">ApexCardArchive@gmail.com</p>
      </div>
      <div class="oww-form-header__title-wrap">
        <p class="oww-form-header__order-label">ORDER FORM</p>
        <p class="oww-form-header__sub">TRADING CARD STORAGE CABINETS</p>
      </div>
    </div>
```

- [ ] **Step 2: Update order form footer strip**

In `sections/order-form.liquid`, find lines 166–171 (the `FOOTER STRIP` section):

```liquid
    <!-- ── FOOTER STRIP ───────────────────────────────── -->
    <div class="oww-form-footer">
      <span class="oww-form-footer__text">OXFORD WOOD WORKS</span>
      <div class="oww-form-footer__rule"></div>
      <span class="oww-form-footer__text">CNC-CUT MDF DOORS</span>
    </div>
```

Replace with:

```liquid
    <!-- ── FOOTER STRIP ───────────────────────────────── -->
    <div class="oww-form-footer">
      <span class="oww-form-footer__text">THE APEX ARCHIVE</span>
      <div class="oww-form-footer__rule"></div>
      <span class="oww-form-footer__text">TRADING CARD STORAGE CABINETS</span>
    </div>
```

- [ ] **Step 3: Verify order form at http://localhost:9292/pages/order-form**

The form header should show the circular Apex Archive logo and new contact/subtitle text. The footer strip should read "THE APEX ARCHIVE" and "TRADING CARD STORAGE CABINETS".

- [ ] **Step 4: Commit order form changes**

```powershell
git add sections/order-form.liquid
git commit -m "feat: rebrand order form to The Apex Archive"
```

---

## Task 5: Update homepage hero

**Files:**
- Modify: `sections/homepage-hero.liquid`

The hero currently references `cnc-hero.jpg` (a CNC door image) and has Oxford Wood Works copy. Replace the copy and note the image placeholder.

- [ ] **Step 1: Update hero headline and CTAs**

In `sections/homepage-hero.liquid`, replace lines 1–12:

```liquid
<section class="homepage-hero">
  <div class="homepage-hero__bg" style="background-image: url('{{ 'cnc-hero.jpg' | asset_url }}');"></div>
  <div class="homepage-hero__fade"></div>
  <div class="homepage-hero__content">
    <h1 class="homepage-hero__headline">Handcrafted quality meets machined precision</h1>
    <div class="homepage-hero__ctas">
      <a href="/pages/door-profiles" class="homepage-hero__btn homepage-hero__btn--primary">Door Profiles</a>
      <a href="/pages/about" class="homepage-hero__btn homepage-hero__btn--outline">Our Story</a>
      <a href="/pages/order-form" class="homepage-hero__btn homepage-hero__btn--outline">Get a Quote</a>
    </div>
  </div>
</section>
```

Replace with:

```liquid
<section class="homepage-hero">
  <div class="homepage-hero__bg" style="background-image: url('{{ 'cnc-hero.jpg' | asset_url }}');"></div>
  <div class="homepage-hero__fade"></div>
  <div class="homepage-hero__content">
    <p class="homepage-hero__eyebrow">✦ The Crown Jewel of Your Collection ✦</p>
    <h1 class="homepage-hero__headline">Elite Trading Card<br>Storage Cabinets</h1>
    <p class="homepage-hero__subhead">Designed for the serious collector. Artisanal-grade craftsmanship, precision hardware, total customization.</p>
    <div class="homepage-hero__ctas">
      <a href="/collections/all" class="homepage-hero__btn homepage-hero__btn--primary">Shop Cabinets</a>
      <a href="/pages/configure" class="homepage-hero__btn homepage-hero__btn--outline">Configure Yours</a>
      <a href="/pages/order-form" class="homepage-hero__btn homepage-hero__btn--outline">Get a Quote</a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add eyebrow and subhead styles to the section stylesheet**

In `sections/homepage-hero.liquid`, find the `{% stylesheet %}` block. Add these rules after the existing `.homepage-hero__headline` rule:

```css
  .homepage-hero__eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    color: #c9a96e;
    text-transform: uppercase;
    margin-bottom: 1rem;
    font-family: var(--font-heading--family);
  }

  .homepage-hero__subhead {
    font-size: 1.05rem;
    color: #b5a898;
    max-width: 560px;
    margin: 1rem auto 1.75rem;
    line-height: 1.65;
  }
```

- [ ] **Step 3: Verify hero at http://localhost:9292**

The homepage should show the new headline "Elite Trading Card Storage Cabinets" with the gold eyebrow and three updated CTA buttons. The background image will still be the CNC image — that's expected until the buyer provides Apex Archive product photography.

- [ ] **Step 4: Commit hero changes**

```powershell
git add sections/homepage-hero.liquid
git commit -m "feat: update homepage hero copy for Apex Archive"
```

---

## Task 6: Update the About page

**Files:**
- Modify: `sections/about.liquid`

Replace all Oxford Wood Works content with Apex Archive brand story, the 5 feature pillars from the product flyer, and updated CTAs.

- [ ] **Step 1: Replace the About page content section**

In `sections/about.liquid`, replace everything from line 1 to the opening `<style>` tag (line 49):

```liquid
<div class="about-page">

  <div class="about-page__hero">
    <p class="about-page__eyebrow">About / Our Story</p>
    <h1 class="about-page__title">Built for the<br>serious collector</h1>
  </div>

  <div class="about-page__body">
    <div class="about-page__intro">
      <p>The Apex Archive was built around a single obsession: giving serious trading card collectors a storage solution worthy of their collection. Every cabinet we make is designed to protect, preserve, and showcase your graded slabs, top-loaders, and raw cards — the way they deserve to be displayed.</p>
      <p>We build to order. That means no compromises on size, finish, or configuration. You tell us what you need, and we build it — with solid dovetail maple drawer boxes, Blum Movento soft-close slides, and Stylelite exterior panels in your choice of high-gloss or matte finish.</p>
      <p>The Crown Jewel of Your Collection deserves a home that matches it.</p>
    </div>

    <div class="about-page__values">
      <div class="about-page__value">
        <p class="about-page__value-label">Masterful Craft</p>
        <p class="about-page__value-body">Solid dovetail maple drawer boxes, prefinished for enduring quality. Built the way furniture was meant to be built.</p>
      </div>
      <div class="about-page__value">
        <p class="about-page__value-label">High-Tech Finishes</p>
        <p class="about-page__value-body">3/4" Stylelite exterior panels in multiple color options, high-gloss or matte. Your cabinet, your style.</p>
      </div>
      <div class="about-page__value">
        <p class="about-page__value-label">Precision Hardware</p>
        <p class="about-page__value-body">Blum Movento undermount slides with silent soft-close action. The hardware serious collectors expect.</p>
      </div>
      <div class="about-page__value">
        <p class="about-page__value-label">Total Customization</p>
        <p class="about-page__value-body">Fully adjustable 1/2" plywood dividers for graded slabs and raw cards. Configure your drawers exactly as you need them.</p>
      </div>
      <div class="about-page__value">
        <p class="about-page__value-label">Massive Capacity</p>
        <p class="about-page__value-body">Securely houses up to 3,400+ PSA Slabs or 11,200+ Top-Loaders on standard models. Capacity varies by size.</p>
      </div>
    </div>
  </div>

  <div class="about-page__testimonials">
    <p class="about-page__eyebrow">What collectors are saying</p>
    <div class="about-page__testimonial">
      <p class="about-page__testimonial-quote">"Finally a cabinet built specifically for graded cards. The soft-close drawers, the finish quality, the capacity — nothing else comes close."</p>
      <p class="about-page__testimonial-attr">— Apex Archive Customer</p>
    </div>
  </div>

  <div class="about-page__cta-strip">
    <p>Ready to protect your collection?</p>
    <div class="about-page__cta-btns">
      <a href="/pages/configure" class="about-page__btn about-page__btn--primary">Configure Your Cabinet</a>
      <a href="/pages/order-form" class="about-page__btn about-page__btn--outline">Get a Quote</a>
    </div>
  </div>

</div>
```

- [ ] **Step 2: Verify about page at http://localhost:9292/pages/about**

The page should show the new brand story, the 5 feature pillars (Masterful Craft, High-Tech Finishes, etc.), an updated testimonial, and CTA buttons that no longer link to Door Profiles.

- [ ] **Step 3: Commit about page changes**

```powershell
git add sections/about.liquid
git commit -m "feat: replace About page content with Apex Archive brand story"
```

---

## Task 7: Update Build Your Cabinet configurator colors and copy

**Files:**
- Modify: `sections/cabinet-configurator.liquid`

The configurator has hardcoded color values and copy that reference the old brand. Update colors throughout and fix copy that doesn't apply to trading card cabinets.

- [ ] **Step 1: Update all hardcoded background colors**

In `sections/cabinet-configurator.liquid`, use Find & Replace (Ctrl+H in VS Code) to make these substitutions:

| Find | Replace |
|------|---------|
| `background: #1c1c1c` | `background: #1e1410` |
| `background: #242424` | `background: #2c1e12` |
| `color: #1c1c1c` | `color: #1e1410` |
| `#242424` (any remaining) | `#2c1e12` |

After replacing, scan the file to ensure no `#1c1c1c` or `#242424` values remain:
```powershell
Select-String -Path "c:\VS Code\Website Fuckery\sections\cabinet-configurator.liquid" -Pattern "#1c1c1c|#242424"
```
Expected: No results.

- [ ] **Step 2: Update hero subheading copy**

Find line 19:
```liquid
  <p class="cab-hero__sub">Choose your width, depth, and finish. We build it to spec and ship it to your door.</p>
```

Replace with:
```liquid
  <p class="cab-hero__sub">Choose your size, depth, and finish. Every cabinet is built to your exact spec.</p>
```

- [ ] **Step 3: Update the callout descriptions**

Find lines 114–124 (the three callout descriptions):
```liquid
    <div class="cab-callout__desc">Every cabinet is cut to your exact dimensions in our CNC shop.</div>
```
```liquid
    <div class="cab-callout__desc">Flat-packed and shipped to your door at no extra cost.</div>
```
```liquid
    <div class="cab-callout__desc">Quick turnaround from order to delivery.</div>
```

Replace the three descriptions with:
```liquid
    <div class="cab-callout__desc">Every cabinet is built to your exact dimensions — solid dovetail maple, Blum hardware.</div>
```
```liquid
    <div class="cab-callout__desc">White-glove delivery. Your cabinet arrives assembled and ready to display your collection.</div>
```
```liquid
    <div class="cab-callout__desc">Made to order. Lead time provided at checkout based on current build queue.</div>
```

- [ ] **Step 4: Note the placeholder image**

The configurator currently uses `black-cabinet-hero-mdf.jpg` as the default preview image (line 12). This is intentionally left as a placeholder until the buyer provides Apex Archive cabinet photography. No code change needed here — just note it for the buyer.

- [ ] **Step 5: Verify configurator at http://localhost:9292/pages/configure**

The configurator should render with warm brown backgrounds instead of cool black. The hero subheading and callout text should read correctly for trading card cabinets.

- [ ] **Step 6: Commit configurator updates**

```powershell
git add sections/cabinet-configurator.liquid
git commit -m "feat: update configurator colors and copy for Apex Archive"
```

---

## Task 8: Remove archived sections from navigation

Navigation menus in Shopify are managed through the admin, not in code. This task is done in the browser.

- [ ] **Step 1: Open Shopify Admin navigation**

Go to: Shopify Admin → Online Store → Navigation

- [ ] **Step 2: Remove Door Profiles from the main menu**

Open the "Main menu" (or whatever menu appears in the header). Find any menu item linking to `/pages/door-profiles` and delete it.

- [ ] **Step 3: Remove Cabinet Configurator 2 from any menus**

Find any menu item linking to the Cabinet Configurator 2 page (look for links to `/pages/cabinet-builder-3d` or similar) and delete it.

- [ ] **Step 4: Save the menu**

Click "Save menu" in Shopify Admin.

- [ ] **Step 5: Verify navigation at http://localhost:9292**

Refresh the local preview. The header navigation should no longer show Door Profiles or Cabinet Configurator 2 links. No broken links should appear.

---

## Task 9: Update CEM configurator comment (minor cleanup)

**Files:**
- Modify: `sections/cem-cabinet-configurator.liquid` (line ~117)

- [ ] **Step 1: Find and update the Oxford Wood Works reference**

In `sections/cem-cabinet-configurator.liquid`, search for "Oxford Wood Works" (around line 117). It's in a comment. Update the comment to reference The Apex Archive instead.

Run:
```powershell
Select-String -Path "c:\VS Code\Website Fuckery\sections\cem-cabinet-configurator.liquid" -Pattern "Oxford Wood Works"
```

This shows the exact line number. Open the file and change:
- `Oxford Wood Works chrome` → `Apex Archive chrome` (or remove the comment if it's just descriptive)

- [ ] **Step 2: Commit the cleanup**

```powershell
git add sections/cem-cabinet-configurator.liquid
git commit -m "chore: update brand name in cem-cabinet-configurator comment"
```

---

## Task 10: Update CLAUDE.md for new project identity

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the project header and client details**

In `CLAUDE.md`, update the following fields:

| Find | Replace with |
|------|-------------|
| `# Oxford Wood Works — Claude Code Guide` | `# The Apex Archive — Claude Code Guide` |
| `**Client:** Phill Anton` | `**Client:** The Apex Archive buyer` |
| `**Site:** Oxford Wood Works — ecommerce store selling CNC-cut MDF doors` | `**Site:** The Apex Archive — ecommerce store selling trading card storage cabinets` |
| The phillanton.com permission note | Remove (no longer applicable) |

- [ ] **Step 2: Update the Design System section colors**

Replace the old color table values:

| Token | New value |
|-------|-----------|
| Background | `#1e1410` |
| Cards/secondary | `#2c1e12` |
| Heading text | `#f0ede8` |
| Body text | `#b5a898` |
| Accent/gold | `#c9a96e` |
| Borders | `#3d2a18` |
| Parchment strip | `#e8dfc8` (new) |

- [ ] **Step 3: Update the Todoist section task sections**

In the Todoist section, update the `Sections in this project:` line:

Change: `Sections in this project: Oxford Wood Works | CEM Configurator | T-Shirt Business | Time Tracker | Admin / General`

To: `Sections in this project: Apex Archive | CEM Configurator | T-Shirt Business | Time Tracker | Admin / General`

- [ ] **Step 4: Commit CLAUDE.md**

```powershell
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Apex Archive rebrand"
```

---

## Task 11: Final review and push

- [ ] **Step 1: Full site walkthrough**

With `shopify theme dev` running, visit each of these pages and check:
- http://localhost:9292 — homepage hero, colors, nav
- http://localhost:9292/pages/about — Apex Archive brand story
- http://localhost:9292/pages/order-form — rebranded order form
- http://localhost:9292/pages/configure — Build Your Cabinet configurator (should still work)
- Check the header logo on every page

- [ ] **Step 2: Search for any remaining Oxford Wood Works references**

```powershell
Select-String -Path "c:\VS Code\Website Fuckery\sections\*.liquid" -Pattern "Oxford Wood Works" -Recurse
Select-String -Path "c:\VS Code\Website Fuckery\blocks\*.liquid" -Pattern "Oxford Wood Works" -Recurse
```

If any results appear, fix them before continuing.

- [ ] **Step 3: Push branch to GitHub**

```powershell
git push origin apex-archive-rebrand
```

- [ ] **Step 4: Review on the Shopify dev theme**

In Shopify Admin → Online Store → Themes, verify the unpublished dev theme (connected to the `develop` branch or preview) reflects the new branding. If not, run:

```powershell
shopify theme push --store ywbx1x-1n.myshopify.com --theme <DEV-THEME-ID>
```

- [ ] **Step 5: Buyer sign-off before merging to main**

Do NOT merge to `main` (the live theme) until the buyer has reviewed the dev theme and approved it. When approved:

```powershell
git checkout main
git merge apex-archive-rebrand
git push origin main
```

---

## Pending items (require buyer input)

These are intentionally left for after launch:
- **Hero photography:** `cnc-hero.jpg` is still in use as a placeholder. Replace with Apex Archive cabinet photography when available.
- **Custom domain:** `ApexCardArchive@gmail.com` is used in the order form. Update if a proper domain is established.
- **Shopify admin logo:** Upload `apex-archive-logo.png` via Shopify Admin → Online Store → Themes → Customize → Header (logo setting), so it's stored as the official theme logo rather than the fallback.
- **Product catalog:** No actual trading card cabinet products have been created in Shopify yet. Add products/collections for each cabinet model.
- **Todoist:** Move Apex Archive tasks from the `Oxford Wood Works` section to an `Apex Archive` section in the VS Code project.
