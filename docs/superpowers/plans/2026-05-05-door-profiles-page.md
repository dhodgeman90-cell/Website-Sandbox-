# Door Profiles Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/pages/door-profiles` gallery page and a `/pages/quote` placeholder page on the Oxford Wood Works Shopify theme.

**Architecture:** Four new files — two Liquid sections and two JSON page templates. The door-profiles section hardcodes 6 profiles using a Liquid split-string loop, renders a dark placeholder when images are missing, and links each card to the quote page. No existing theme files change except the homepage hero CTA link.

**Tech Stack:** Shopify Liquid, CSS (inside `{% stylesheet %}` blocks), Shopify CLI for local preview.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `sections/door-profiles.liquid` | Gallery header, 3×2 card grid, footer note, all CSS |
| Create | `templates/page.door-profiles.json` | Wires the door-profiles section to the `/pages/door-profiles` page |
| Create | `sections/quote-placeholder.liquid` | Centred "coming soon" quote page with CTA to /pages/contact |
| Create | `templates/page.quote.json` | Wires the quote-placeholder section to the `/pages/quote` page |
| Modify | `sections/homepage-hero.liquid` | Fix "Door Profiles" CTA link from `/collections/all` → `/pages/door-profiles` |

---

## Before You Start

Run the local dev server so you can see changes live:
```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```
Open `http://localhost:9292` in your browser. Leave this running throughout.

---

## Task 1: Create the door-profiles section

**Files:**
- Create: `sections/door-profiles.liquid`

- [ ] **Step 1: Create the section file**

Create `sections/door-profiles.liquid` with the following content in full:

```liquid
<div class="door-profiles-page">
  <div class="door-profiles-header">
    <p class="door-profiles-eyebrow">Our Range</p>
    <h1 class="door-profiles-title">Door Profiles</h1>
    <p class="door-profiles-subtitle">CNC-cut MDF doors machined to precision. Each profile is available in custom sizes and finishes — select a design and request a quote to get started.</p>
  </div>

  <div class="door-profiles-grid">
    {%- assign profile_data = "S001|Shaker|door-s001.jpg,S002|Bevel Shaker|door-s002.jpg,S003|Double Shaker|door-s003.jpg,S004|Slim Shaker|door-s004.jpg,S005|Skinny 150V|door-s005.jpg,S006|Skinny Bead 125|door-s006.jpg" -%}
    {%- assign profiles = profile_data | split: "," -%}
    {%- for profile_str in profiles -%}
      {%- assign parts = profile_str | split: "|" -%}
      {%- assign code = parts[0] -%}
      {%- assign name = parts[1] -%}
      {%- assign image_file = parts[2] -%}
      <div class="door-profile-card">
        <div class="door-profile-card__image">
          <div class="door-profile-card__placeholder">
            <span class="door-profile-card__placeholder-code">{{ code }}</span>
          </div>
          <img
            src="{{ image_file | asset_url }}"
            alt="{{ name }} door profile"
            loading="lazy"
            class="door-profile-card__img"
            onerror="this.style.display='none'"
          >
        </div>
        <div class="door-profile-card__info">
          <div class="door-profile-card__meta">
            <p class="door-profile-card__code">{{ code }}</p>
            <p class="door-profile-card__name">{{ name }}</p>
          </div>
          <a href="/pages/quote?profile={{ code | url_encode }}" class="door-profile-card__cta">Get a Quote</a>
        </div>
      </div>
    {%- endfor -%}
  </div>

  <div class="door-profiles-footer-note">
    <p>Looking for a profile not listed here? <a href="/pages/contact" class="door-profiles-contact-link">Contact us</a> — more designs available on request.</p>
  </div>
</div>

{% stylesheet %}
  .door-profiles-page {
    background: #1c1c1c;
    min-height: 60vh;
  }

  .door-profiles-header {
    padding: 56px 40px 40px;
    border-bottom: 1px solid #2e2e2e;
    max-width: 1200px;
    margin: 0 auto;
  }

  .door-profiles-eyebrow {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a96e;
    margin: 0 0 12px;
  }

  .door-profiles-title {
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    color: #f0ede8;
    font-weight: 400;
    margin: 0 0 14px;
    letter-spacing: -0.01em;
  }

  .door-profiles-subtitle {
    font-size: 0.85rem;
    color: #d4cfc9;
    max-width: 520px;
    line-height: 1.7;
    margin: 0;
  }

  .door-profiles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #2e2e2e;
    max-width: 1200px;
    margin: 0 auto;
  }

  .door-profile-card {
    background: #1c1c1c;
    display: flex;
    flex-direction: column;
  }

  .door-profile-card__image {
    position: relative;
    height: 220px;
    background: #111111;
    overflow: hidden;
  }

  .door-profile-card__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .door-profile-card__placeholder-code {
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #2e2e2e;
  }

  .door-profile-card__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .door-profile-card__info {
    padding: 16px 20px 20px;
    border-top: 1px solid #2e2e2e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .door-profile-card__code {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a96e;
    margin: 0 0 4px;
  }

  .door-profile-card__name {
    font-size: 0.9rem;
    color: #f0ede8;
    font-weight: 500;
    margin: 0;
    line-height: 1.3;
  }

  .door-profile-card__cta {
    flex-shrink: 0;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #f0ede8;
    border: 1px solid rgba(240, 237, 232, 0.35);
    padding: 8px 14px;
    text-decoration: none;
    white-space: nowrap;
    transition: border-color 0.2s ease, color 0.2s ease;
  }

  .door-profile-card__cta:hover {
    border-color: #c9a96e;
    color: #c9a96e;
  }

  .door-profiles-footer-note {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 40px;
    border-top: 1px solid #2e2e2e;
    text-align: center;
  }

  .door-profiles-footer-note p {
    font-size: 0.78rem;
    color: #d4cfc9;
    margin: 0;
    line-height: 1.6;
  }

  .door-profiles-contact-link {
    color: #c9a96e;
    text-decoration: none;
  }

  .door-profiles-contact-link:hover {
    text-decoration: underline;
  }

  @media screen and (max-width: 989px) {
    .door-profiles-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media screen and (max-width: 749px) {
    .door-profiles-header {
      padding: 36px 20px 28px;
    }
    .door-profiles-grid {
      grid-template-columns: 1fr;
    }
    .door-profiles-footer-note {
      padding: 24px 20px;
    }
  }
{% endstylesheet %}

{% schema %}
{
  "name": "Door Profiles",
  "settings": [],
  "presets": []
}
{% endschema %}
```

- [ ] **Step 2: Commit**

```powershell
git add sections/door-profiles.liquid
git commit -m "Add door-profiles section with 6-card grid and image placeholder logic"
```

---

## Task 2: Create the door-profiles page template

**Files:**
- Create: `templates/page.door-profiles.json`

- [ ] **Step 1: Create the template file**

Create `templates/page.door-profiles.json` with this exact content:

```json
{
  "sections": {
    "main": {
      "type": "door-profiles",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

- [ ] **Step 2: Commit**

```powershell
git add templates/page.door-profiles.json
git commit -m "Add page template for door-profiles"
```

---

## Task 3: Create the quote placeholder section

**Files:**
- Create: `sections/quote-placeholder.liquid`

- [ ] **Step 1: Create the section file**

Create `sections/quote-placeholder.liquid` with the following content in full:

```liquid
<div class="quote-placeholder">
  <div class="quote-placeholder__inner">
    <p class="quote-placeholder__eyebrow">Coming Soon</p>
    <h1 class="quote-placeholder__title">Request a Quote</h1>
    <p class="quote-placeholder__body">Our pricing calculator is on its way. In the meantime, get in touch directly and we'll work out a price based on your door size, profile, and finish.</p>
    <a href="/pages/contact" class="quote-placeholder__btn">Contact Us</a>
  </div>
</div>

{% stylesheet %}
  .quote-placeholder {
    background: #1c1c1c;
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
  }

  .quote-placeholder__inner {
    text-align: center;
    max-width: 520px;
  }

  .quote-placeholder__eyebrow {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c9a96e;
    margin: 0 0 16px;
  }

  .quote-placeholder__title {
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    color: #f0ede8;
    font-weight: 400;
    margin: 0 0 20px;
    letter-spacing: -0.01em;
  }

  .quote-placeholder__body {
    font-size: 0.88rem;
    color: #d4cfc9;
    line-height: 1.75;
    margin: 0 0 36px;
  }

  .quote-placeholder__btn {
    display: inline-block;
    padding: 13px 32px;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: #c9a96e;
    color: #1c1c1c;
    text-decoration: none;
    border: 1px solid #c9a96e;
    transition: opacity 0.2s ease;
  }

  .quote-placeholder__btn:hover {
    opacity: 0.8;
  }
{% endstylesheet %}

{% schema %}
{
  "name": "Quote Placeholder",
  "settings": [],
  "presets": []
}
{% endschema %}
```

- [ ] **Step 2: Commit**

```powershell
git add sections/quote-placeholder.liquid
git commit -m "Add quote placeholder section for future price calculator"
```

---

## Task 4: Create the quote page template

**Files:**
- Create: `templates/page.quote.json`

- [ ] **Step 1: Create the template file**

Create `templates/page.quote.json` with this exact content:

```json
{
  "sections": {
    "main": {
      "type": "quote-placeholder",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

- [ ] **Step 2: Commit**

```powershell
git add templates/page.quote.json
git commit -m "Add page template for quote placeholder"
```

---

## Task 5: Fix the homepage hero CTA link

**Files:**
- Modify: `sections/homepage-hero.liquid` line 7

The "Door Profiles" button currently links to `/collections/all`. Update it to point to the new page.

- [ ] **Step 1: Update the link**

In `sections/homepage-hero.liquid`, find line 7:
```liquid
<a href="{{ routes.collections_url }}/all" class="homepage-hero__btn homepage-hero__btn--primary">Door Profiles</a>
```

Change it to:
```liquid
<a href="/pages/door-profiles" class="homepage-hero__btn homepage-hero__btn--primary">Door Profiles</a>
```

- [ ] **Step 2: Commit**

```powershell
git add sections/homepage-hero.liquid
git commit -m "Update Door Profiles hero CTA to link to /pages/door-profiles"
```

---

## Task 6: Push to Shopify and create the pages

These steps are done manually in the browser — no code to write.

- [ ] **Step 1: Push all changes to Shopify**

```powershell
shopify theme push --store ywbx1x-1n.myshopify.com
```

Wait for it to complete.

- [ ] **Step 2: Create the Door Profiles page in Shopify admin**

1. Go to your Shopify admin: `https://admin.shopify.com/store/ywbx1x-1n`
2. Click **Online Store → Pages**
3. Click **Add page**
4. Set **Title** to: `Door Profiles`
5. Leave the content body empty
6. On the right sidebar under **Theme template**, select `door-profiles`
7. Click **Save**

- [ ] **Step 3: Create the Quote page in Shopify admin**

1. Still in **Online Store → Pages**, click **Add page** again
2. Set **Title** to: `Request a Quote`
3. Leave the content body empty
4. On the right sidebar under **Theme template**, select `quote`
5. Click **Save**

- [ ] **Step 4: Add Door Profiles to the navigation menu**

1. Go to **Online Store → Navigation**
2. Click **Main menu**
3. Click **Add menu item**
4. Set **Name** to: `Door Profiles`
5. Set **Link** to: Pages → Door Profiles
6. Click **Add** then **Save menu**

- [ ] **Step 5: Verify both pages in the browser**

Open these URLs and check they render correctly:
- `http://localhost:9292/pages/door-profiles` — should show the header, 3×2 dark card grid with placeholder slots, footer note
- `http://localhost:9292/pages/quote` — should show the centred "Request a Quote" coming-soon section with a gold "Contact Us" button
- `http://localhost:9292` → click "Door Profiles" button in the hero — should navigate to the door profiles page

- [ ] **Step 6: Check responsiveness**

In your browser DevTools (F12 → Toggle device toolbar), check:
- At 768px wide: grid should switch to 2 columns
- At 375px wide: grid should stack to 1 column, header padding reduces

---

## Adding Door Images Later

When you have recolored images ready, upload them to Shopify:

1. Go to **Shopify Admin → Content → Files**
2. Upload each image with the exact filename from the table below
3. Images appear on the page automatically — no code changes needed

| Upload this filename | Shows on card |
|----------------------|---------------|
| `door-s001.jpg` | S001 Shaker |
| `door-s002.jpg` | S002 Bevel Shaker |
| `door-s003.jpg` | S003 Double Shaker |
| `door-s004.jpg` | S004 Slim Shaker |
| `door-s005.jpg` | S005 Skinny 150V |
| `door-s006.jpg` | S006 Skinny Bead 125 |

**Recommended image spec:** Minimum 800×1100px, portrait, JPEG, door centred on a `#1c1c1c` dark background.
