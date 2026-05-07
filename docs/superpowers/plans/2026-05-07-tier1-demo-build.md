# Oxford Wood Works — Tier 1 Demo Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Oxford Wood Works site to a polished Tier 1 demo — the working proof-of-concept used to sell the cabinet shop website package to prospects.

**Architecture:** All work is in Shopify Liquid theme files (Dawn base). New sections are added as standalone `.liquid` files in `/sections/`, then wired into page templates via `/templates/*.json`. No JavaScript frameworks, no apps — vanilla CSS and Liquid only. Verification is always visual: run `shopify theme dev`, check the browser.

**Tech Stack:** Shopify Online Store 2.0, Dawn theme, Liquid, vanilla CSS

---

## File Map

| Action | File | What it does |
|--------|------|-------------|
| Fix | `sections/door-profiles.liquid:9` | Correct broken `.webp` → `.png` for S002 |
| Modify | `sections/homepage-hero.liquid:8` | Fix dead "Explore Our Work" CTA |
| Create | `sections/homepage-value-props.liquid` | 3-column strip below hero |
| Create | `sections/homepage-profiles-preview.liquid` | 3-card door preview with "View All" CTA |
| Modify | `templates/index.json` | Wire both new sections into homepage |
| Create | `sections/about.liquid` | Oxford Wood Works story + values |
| Create | `templates/page.about.json` | Template that renders the about section |
| Admin only | Shopify Admin → Pages | Create About page, assign template |
| Admin only | Shopify Admin → Navigation | Add Door Profiles, About, Contact to header |

---

## Before You Start

Run the dev server in a PowerShell terminal and leave it running throughout. Every task ends with a visual check.

```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```

Browser opens at `http://localhost:9292`. Keep this tab open.

---

## Task 1: Fix the broken door-s002 image

**File:** `sections/door-profiles.liquid`

The code references `door-s002.webp` but the actual file in `assets/` is `door-s002.png`. This means the S002 card currently shows a blank placeholder instead of the door image.

- [ ] **Step 1: Open `sections/door-profiles.liquid` and find line 9.** It reads:

```
{%- assign profile_data = "S001|Shaker|door-s001.png,S002|Bevel Shaker|door-s002.webp, ..." -%}
```

Change `door-s002.webp` to `door-s002.png`:

```liquid
{%- assign profile_data = "S001|Shaker|door-s001.png,S002|Bevel Shaker|door-s002.png,S003|Double Shaker|door-s003.png,S004|Slim Shaker|door-s004.png,S005|Skinny 150V|door-s005.png,S006|Skinny Bead 125|door-s006.png" -%}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:9292/pages/door-profiles`. The S001 and S002 cards should both show door images. S003–S006 will show clean placeholder cards (the profile code in grey text on a light background) — this is intentional and looks fine.

- [ ] **Step 3: Commit**

```powershell
git add sections/door-profiles.liquid
git commit -m "Fix door-s002 image extension webp to png"
git push origin main
```

---

## Task 2: Fix the hero's dead CTA

**File:** `sections/homepage-hero.liquid`

The "Explore Our Work" button links to `/collections/all`, which is empty (no products exist). Change it to link to the About page so all three hero buttons go somewhere real.

- [ ] **Step 1: Open `sections/homepage-hero.liquid` and find line 8.** It reads:

```liquid
<a href="{{ routes.collections_url }}/all" class="homepage-hero__btn homepage-hero__btn--outline">Explore Our Work</a>
```

Replace that line with:

```liquid
<a href="/pages/about" class="homepage-hero__btn homepage-hero__btn--outline">Our Story</a>
```

- [ ] **Step 2: Verify in browser**

Go to `http://localhost:9292`. The hero should now show three buttons: **Door Profiles** (white/filled), **Our Story** (outline), **Get a Quote** (outline). Clicking "Our Story" will 404 for now — that's expected until Task 6 creates the About page.

- [ ] **Step 3: Commit**

```powershell
git add sections/homepage-hero.liquid
git commit -m "Update hero CTA from dead collections link to About page"
git push origin main
```

---

## Task 3: Create the homepage value props section

**File to create:** `sections/homepage-value-props.liquid`

This is a narrow 3-column strip that sits immediately below the hero and tells visitors what Oxford Wood Works is about before they scroll further.

- [ ] **Step 1: Create the file** at `sections/homepage-value-props.liquid` with this exact content:

```liquid
<div class="value-props">
  <div class="value-props__inner">
    <div class="value-props__item">
      <p class="value-props__label">Custom Sizes</p>
      <p class="value-props__body">Every door machined to your exact width and height — no standard sizes, no compromise.</p>
    </div>
    <div class="value-props__divider"></div>
    <div class="value-props__item">
      <p class="value-props__label">CNC Precision</p>
      <p class="value-props__body">Cut to exact tolerances on professional CNC equipment. Profiles are consistent across every single door.</p>
    </div>
    <div class="value-props__divider"></div>
    <div class="value-props__item">
      <p class="value-props__label">6 Profiles</p>
      <p class="value-props__body">Choose from our curated range of MDF door designs — Shaker, Bevel, Slim, and more — all available to order.</p>
    </div>
  </div>
</div>

<style>
  .value-props {
    background: #000000;
    border-top: 1px solid #1e1e1e;
    border-bottom: 1px solid #1e1e1e;
  }

  .value-props__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 56px 40px;
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 0;
    align-items: start;
  }

  .value-props__item {
    padding: 0 32px;
  }

  .value-props__item:first-child {
    padding-left: 0;
  }

  .value-props__item:last-child {
    padding-right: 0;
  }

  .value-props__divider {
    width: 1px;
    background: #1e1e1e;
    align-self: stretch;
    min-height: 60px;
  }

  .value-props__label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a96e;
    margin: 0 0 12px;
  }

  .value-props__body {
    font-size: 0.82rem;
    color: #cccccc;
    line-height: 1.75;
    margin: 0;
  }

  @media screen and (max-width: 749px) {
    .value-props__inner {
      grid-template-columns: 1fr;
      padding: 40px 20px;
      gap: 32px;
    }

    .value-props__divider {
      display: none;
    }

    .value-props__item {
      padding: 0;
    }
  }
</style>

{% schema %}
{
  "name": "Value Props",
  "settings": [],
  "presets": []
}
{% endschema %}
```

- [ ] **Step 2: Add the section to the homepage template**

Open `templates/index.json`. Replace the entire file contents with:

```json
{
  "sections": {
    "homepage_hero": {
      "type": "homepage-hero",
      "settings": {}
    },
    "value_props": {
      "type": "homepage-value-props",
      "settings": {}
    },
    "profiles_preview": {
      "type": "homepage-profiles-preview",
      "settings": {}
    }
  },
  "order": [
    "homepage_hero",
    "value_props",
    "profiles_preview"
  ]
}
```

Note: `profiles_preview` won't exist yet until Task 4 — that's fine, the theme will silently skip it.

- [ ] **Step 3: Verify in browser**

Go to `http://localhost:9292`. Below the hero you should see a dark strip with three columns: **Custom Sizes**, **CNC Precision**, **6 Profiles**. Gold label text, grey body text, vertical dividers. On mobile the dividers collapse into a single-column list.

- [ ] **Step 4: Commit**

```powershell
git add sections/homepage-value-props.liquid templates/index.json
git commit -m "Add value props section to homepage"
git push origin main
```

---

## Task 4: Create the homepage door profiles preview

**File to create:** `sections/homepage-profiles-preview.liquid`

Shows the first three door profiles as a card grid, with a headline and a "View Full Range" CTA below. This gives visitors a taste of the product before they click through.

- [ ] **Step 1: Create the file** at `sections/homepage-profiles-preview.liquid` with this exact content:

```liquid
<div class="profiles-preview">
  <div class="profiles-preview__header">
    <p class="profiles-preview__eyebrow">Our Range</p>
    <h2 class="profiles-preview__title">Door Profiles</h2>
    <p class="profiles-preview__subtitle">CNC-cut MDF doors available in custom sizes and finishes. Browse the full range or get in touch to start an order.</p>
  </div>

  <div class="profiles-preview__grid">
    {%- assign preview_data = "S001|Shaker|door-s001.png,S002|Bevel Shaker|door-s002.png,S003|Double Shaker|door-s003.png" -%}
    {%- assign preview_profiles = preview_data | split: "," -%}
    {%- for profile_str in preview_profiles -%}
      {%- assign parts = profile_str | split: "|" -%}
      {%- assign code = parts[0] -%}
      {%- assign name = parts[1] -%}
      {%- assign image_file = parts[2] -%}
      <div class="profiles-preview__card">
        <div class="profiles-preview__card-image">
          <div class="profiles-preview__card-placeholder">
            <span class="profiles-preview__placeholder-code">{{ code }}</span>
          </div>
          <img
            src="{{ image_file | asset_url }}"
            alt="{{ name }} door profile"
            loading="lazy"
            width="800"
            height="1100"
            class="profiles-preview__card-img"
          >
        </div>
        <div class="profiles-preview__card-info">
          <p class="profiles-preview__card-code">{{ code }}</p>
          <p class="profiles-preview__card-name">{{ name }}</p>
        </div>
      </div>
    {%- endfor -%}
  </div>

  <div class="profiles-preview__footer">
    <a href="/pages/door-profiles" class="profiles-preview__cta">View Full Range</a>
  </div>
</div>

<style>
  .profiles-preview {
    background: #000000;
    padding-bottom: 80px;
  }

  .profiles-preview__header {
    padding: 64px 40px 40px;
    max-width: 1200px;
    margin: 0 auto;
    border-bottom: 1px solid #1e1e1e;
  }

  .profiles-preview__eyebrow {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #888888;
    margin: 0 0 12px;
  }

  .profiles-preview__title {
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    color: #ffffff;
    font-weight: 400;
    margin: 0 0 14px;
    letter-spacing: -0.01em;
  }

  .profiles-preview__subtitle {
    font-size: 0.85rem;
    color: #cccccc;
    max-width: 480px;
    line-height: 1.7;
    margin: 0;
  }

  .profiles-preview__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #1e1e1e;
    max-width: 1200px;
    margin: 0 auto;
  }

  .profiles-preview__card {
    background: #000000;
    display: flex;
    flex-direction: column;
  }

  .profiles-preview__card-image {
    position: relative;
    height: 220px;
    background: #f0f0f0;
    overflow: hidden;
  }

  .profiles-preview__card-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profiles-preview__placeholder-code {
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #aaaaaa;
  }

  .profiles-preview__card-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) brightness(0.92) contrast(1.05);
  }

  .profiles-preview__card-info {
    padding: 16px 20px 20px;
    border-top: 1px solid #1e1e1e;
  }

  .profiles-preview__card-code {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #888888;
    margin: 0 0 4px;
  }

  .profiles-preview__card-name {
    font-size: 0.9rem;
    color: #ffffff;
    font-weight: 500;
    margin: 0;
  }

  .profiles-preview__footer {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 40px 0;
    display: flex;
    justify-content: center;
  }

  .profiles-preview__cta {
    display: inline-block;
    padding: 13px 36px;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #ffffff;
    text-decoration: none;
    transition: border-color 0.2s ease;
  }

  .profiles-preview__cta:hover {
    border-color: #ffffff;
  }

  @media screen and (max-width: 989px) {
    .profiles-preview__grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .profiles-preview__grid .profiles-preview__card:last-child {
      display: none;
    }
  }

  @media screen and (max-width: 749px) {
    .profiles-preview__header {
      padding: 40px 20px 28px;
    }

    .profiles-preview__grid {
      grid-template-columns: 1fr;
    }

    .profiles-preview__grid .profiles-preview__card:last-child {
      display: block;
    }

    .profiles-preview__footer {
      padding: 32px 20px 0;
    }
  }
</style>

{% javascript %}
  document.querySelectorAll('.profiles-preview__card-img').forEach(function(img) {
    img.addEventListener('error', function() {
      this.style.display = 'none';
    });
  });
{% endjavascript %}

{% schema %}
{
  "name": "Profiles Preview",
  "settings": [],
  "presets": []
}
{% endschema %}
```

- [ ] **Step 2: Verify in browser**

Go to `http://localhost:9292`. Below the value props strip you should see a section with "Our Range" eyebrow, "Door Profiles" heading, then a 3-column grid showing S001 (with image), S002 (with image), S003 (placeholder card). Below the grid is a "View Full Range" button that links to `/pages/door-profiles`. On tablet (989px and below) it collapses to 2 columns and hides the third card. On mobile it goes to a single column.

- [ ] **Step 3: Commit**

```powershell
git add sections/homepage-profiles-preview.liquid
git commit -m "Add door profiles preview section to homepage"
git push origin main
```

---

## Task 5: Create the About page

**Files to create:** `sections/about.liquid` and `templates/page.about.json`

The About page tells the Oxford Wood Works story — who they are, what they make, and why a customer should trust them. This page also serves as the "Our Story" CTA destination from the hero.

- [ ] **Step 1: Create `sections/about.liquid`** with this content:

```liquid
<div class="about-page">

  <div class="about-page__hero">
    <p class="about-page__eyebrow">Our Story</p>
    <h1 class="about-page__title">Precision doors,<br>built to order</h1>
  </div>

  <div class="about-page__body">
    <div class="about-page__intro">
      <p>Oxford Wood Works began with a simple idea: that a well-made cabinet door shouldn't require a trade account, a minimum order, or a three-week wait. We cut every door to order using CNC equipment — no stock, no waste, no compromise on size.</p>
      <p>Our MDF door profiles are machined from licensed designs. Each one is available in any width and height you specify, ready to prime and paint in the finish of your choice.</p>
    </div>

    <div class="about-page__values">
      <div class="about-page__value">
        <p class="about-page__value-label">Made to measure</p>
        <p class="about-page__value-body">We don't sell standard sizes. Every order is cut to the exact dimensions you provide — down to the millimetre.</p>
      </div>
      <div class="about-page__value">
        <p class="about-page__value-label">CNC machined</p>
        <p class="about-page__value-body">Our profiles are cut on professional CNC equipment. The result is a consistent, repeatable cut across every door in an order.</p>
      </div>
      <div class="about-page__value">
        <p class="about-page__value-label">Ready to finish</p>
        <p class="about-page__value-body">Doors are supplied primed and ready to paint. Choose your finish — matte, satin, gloss — and apply it yourself or have us source a painter.</p>
      </div>
    </div>
  </div>

  <div class="about-page__cta-strip">
    <p>Ready to start an order?</p>
    <div class="about-page__cta-btns">
      <a href="/pages/door-profiles" class="about-page__btn about-page__btn--primary">View Door Profiles</a>
      <a href="/pages/contact" class="about-page__btn about-page__btn--outline">Get in Touch</a>
    </div>
  </div>

</div>

<style>
  .about-page {
    background: #000000;
    min-height: 60vh;
  }

  .about-page__hero {
    padding: 80px 40px 56px;
    max-width: 1200px;
    margin: 0 auto;
    border-bottom: 1px solid #1e1e1e;
  }

  .about-page__eyebrow {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #888888;
    margin: 0 0 16px;
  }

  .about-page__title {
    font-size: clamp(2rem, 4vw, 3.5rem);
    color: #ffffff;
    font-weight: 400;
    line-height: 1.15;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .about-page__body {
    max-width: 1200px;
    margin: 0 auto;
    padding: 56px 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
    border-bottom: 1px solid #1e1e1e;
  }

  .about-page__intro p {
    font-size: 0.9rem;
    color: #cccccc;
    line-height: 1.8;
    margin: 0 0 20px;
  }

  .about-page__intro p:last-child {
    margin-bottom: 0;
  }

  .about-page__values {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .about-page__value {
    border-left: 1px solid #1e1e1e;
    padding-left: 24px;
  }

  .about-page__value-label {
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a96e;
    margin: 0 0 8px;
  }

  .about-page__value-body {
    font-size: 0.82rem;
    color: #cccccc;
    line-height: 1.7;
    margin: 0;
  }

  .about-page__cta-strip {
    max-width: 1200px;
    margin: 0 auto;
    padding: 56px 40px;
    display: flex;
    align-items: center;
    gap: 40px;
  }

  .about-page__cta-strip > p {
    font-size: 0.85rem;
    color: #888888;
    margin: 0;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .about-page__cta-btns {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .about-page__btn {
    display: inline-block;
    padding: 12px 28px;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    transition: opacity 0.2s ease;
    white-space: nowrap;
  }

  .about-page__btn:hover {
    opacity: 0.75;
  }

  .about-page__btn--primary {
    background: #ffffff;
    color: #000000;
    border: 1px solid #ffffff;
  }

  .about-page__btn--outline {
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  @media screen and (max-width: 749px) {
    .about-page__hero {
      padding: 48px 20px 36px;
    }

    .about-page__body {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 40px 20px;
    }

    .about-page__cta-strip {
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
      padding: 40px 20px;
    }
  }
</style>

{% schema %}
{
  "name": "About Page",
  "settings": [],
  "presets": []
}
{% endschema %}
```

- [ ] **Step 2: Create `templates/page.about.json`** with this content:

```json
{
  "sections": {
    "about": {
      "type": "about",
      "settings": {}
    }
  },
  "order": [
    "about"
  ]
}
```

- [ ] **Step 3: Verify files are saved**

The template won't be visible until the About page is created in Shopify admin (Task 6). For now, confirm both files saved correctly — no errors from the dev server in your terminal.

- [ ] **Step 4: Commit**

```powershell
git add sections/about.liquid templates/page.about.json
git commit -m "Add About page section and template"
git push origin main
```

---

## Task 6: Shopify Admin — Create pages and set up navigation

These steps are done in the Shopify Admin website, not in VS Code. Do these in order.

### 6a: Create the About page

- [ ] **Step 1:** Go to [https://ywbx1x-1n.myshopify.com/admin/pages](https://ywbx1x-1n.myshopify.com/admin/pages)
- [ ] **Step 2:** Click **Add page**
- [ ] **Step 3:** Set the title to `About`
- [ ] **Step 4:** Leave the content area blank — the section handles all content
- [ ] **Step 5:** In the right sidebar under **Theme template**, select `page.about` from the dropdown
- [ ] **Step 6:** Click **Save**
- [ ] **Step 7:** Verify by going to `http://localhost:9292/pages/about` — you should see the full About page with the story, values, and CTA strip

### 6b: Update the header navigation

- [ ] **Step 1:** Go to [https://ywbx1x-1n.myshopify.com/admin/menus](https://ywbx1x-1n.myshopify.com/admin/menus)
- [ ] **Step 2:** Click on **Main menu**
- [ ] **Step 3:** Add the following nav items (in this order):
  - **Door Profiles** → link to `/pages/door-profiles`
  - **About** → link to `/pages/about`
  - **Contact** → link to `/pages/contact`
- [ ] **Step 4:** Remove any default nav items that don't belong (Home, Catalogue, etc.)
- [ ] **Step 5:** Click **Save menu**
- [ ] **Step 6:** Verify at `http://localhost:9292` — the header nav should show Door Profiles, About, Contact

---

## Final Verification Checklist

Walk through each page in the browser at `http://localhost:9292` and confirm:

- [ ] **Homepage:** Hero → value props strip (Custom Sizes / CNC Precision / 6 Profiles) → 3-card door preview with "View Full Range" button
- [ ] **Door Profiles:** S001 and S002 show actual door images; S003–S006 show clean placeholder cards; "Get a Quote" buttons on each card link to `/pages/contact` (via `/pages/quote`)
- [ ] **About:** Page loads with story intro, 3 values on the right, CTA strip at the bottom
- [ ] **Contact:** Contact form renders, submits without error
- [ ] **Navigation:** Header shows Door Profiles, About, Contact — all links work
- [ ] **Mobile:** Resize browser to under 750px — all pages reflow cleanly, no overflow, no broken layouts

---

## Push to GitHub

Once all checks pass:

```powershell
git push origin main
```

Shopify will auto-sync from GitHub and deploy to the live theme. The demo site is ready.
