# Order Form — Design Spec
**Date:** 2026-05-08
**Status:** Approved

---

## Context

Oxford Wood Works needs a way for customers to submit door orders and quote requests directly from the website. The existing "Catalog" navigation link will be renamed to "Order Form" and its destination page will be replaced with a branded, submittable order form.

Submissions are sent to the store owner's email via Shopify's built-in contact form — no third-party apps required.

---

## Navigation Change

- Rename the "Catalog" link in the main-menu to **"Order Form"** in Shopify Admin → Online Store → Navigation → Main menu.
- The link target stays the same page handle — update it to point to the new `page.order-form` template.

---

## Page Template

- Create `templates/page.order-form.json` — a new Shopify page template
- Create `sections/order-form.liquid` — the form section assigned to that template
- The Shopify page itself (created in Admin → Pages) will use the `order-form` template

---

## Visual Design

**Style:** Purchase Order / document style — white background, dark branded header, gold accents.  
**Font:** Inter (already loaded in the theme).  
**Layout:** Single centered column, max-width ~860px, subtle box shadow, feels like a real document.

### Header (dark strip)
- Background: `#1c1c1c`
- Left: `oxford-wood-works-logo.svg` from assets
- Right: "ORDER FORM" in large bold uppercase `#f0ede8`, subline "CNC-CUT MDF DOORS" in `#c9a96e`
- Below header: 3px gold gradient rule (`#c9a96e` → `#e8c88a` → `#c9a96e`)

### Request Type Toggle (below gold rule)
- Label: "I am submitting a:"
- Two large clickable cards side-by-side:
  - **Quote Request** — "I'd like a price estimate before committing"
  - **Place an Order** — "I'm ready to go — process my order"
- Selected card: dark fill (`#1c1c1c`), cream text, gold filled radio dot
- Unselected card: light background (`#fafafa`), grey border, empty radio circle
- Default selection: Quote Request
- This is a hidden `<input type="hidden" name="contact[request_type]">` updated by JS on toggle

### Section 1 — Customer Details
Numbered circle (dark bg, gold number), uppercase section label, horizontal rule extending to edge.

Fields (2-column grid, full-width for address):
| Field | Type | Required |
|-------|------|----------|
| Full Name | text | Yes |
| Company / Business | text | No |
| Email Address | email | Yes |
| Phone Number | tel | No |
| Delivery Address | textarea (2 rows) | No |

### Section 2 — Door Details
Same numbered heading style.

Order table with columns: `#` · Qty · Door Style · Width (mm) · Height (mm)

- Table header: `#1c1c1c` background, `#c9a96e` column labels
- Rows: alternating white / `#fafafa` stripe
- **5 rows by default**
- Door Style column: `<select>` dropdown with options:
  - S001 — Shaker
  - S002 — Bevel Shaker
  - S003 — Double Shaker
  - S004 — Slim Shaker
  - S005 — Skinny 150V
  - S006 — Skinny Bead 125
- Qty, Width, Height: `<input type="number">`, minimum 1 for qty, no minimum for dimensions
- **"+ Add another door"** link below table — JS clones the last row and appends it, incrementing the `#` counter. Maximum 20 rows.

### Section 3 — Notes & Special Instructions
Same numbered heading. Single `<textarea>` spanning full width, 4 rows.

### Submit Area
- Left: small helper text — "We'll review your request and be in touch within 1–2 business days." + contact email in gold
- Right: Submit button — dark bg `#1c1c1c`, cream text, uppercase, padded
- **Button label updates dynamically** based on toggle selection:
  - "Submit Quote Request →" when Quote is selected
  - "Submit Order →" when Order is selected

### Footer Strip
- Background: `#1c1c1c`
- "OXFORD WOOD WORKS" left · thin `#2e2e2e` rule · "CNC-CUT MDF DOORS" right

---

## Form Submission (Shopify Contact Form)

The form uses Shopify's native contact form endpoint (`action="/contact#ContactForm"`).

Field name mapping:
- `contact[name]` — Full Name
- `contact[email]` — Email
- `contact[phone]` — Phone
- `contact[body]` — assembled by JS on submit, formatted as plain text:

```
REQUEST TYPE: Quote Request / Place an Order

CUSTOMER DETAILS
Company: ...
Phone: ...
Delivery Address: ...

DOOR ORDER
Row 1: Qty 2 | S001 Shaker | 600mm × 900mm
Row 2: Qty 1 | S003 Double Shaker | 450mm × 750mm
...

NOTES
...
```

- `contact[request_type]` — hidden field updated by the toggle (used in the body assembly)
- Empty order rows (all fields blank) are skipped during body assembly

---

## JavaScript Behaviour

All JS is inline in the section file — no external files.

1. **Toggle:** clicking either request type card updates the hidden field, swaps the selected/unselected visual states, and updates the submit button label
2. **Add Row:** clones the last `<tr>` in the order table, clears its values, increments the row number, appends to `<tbody>`
3. **Submit:** intercepts form submit, assembles the formatted body string from all visible fields, writes it to `contact[body]`, then allows the form to submit normally

---

## Print / PDF

A `@media print` stylesheet is included so the page prints cleanly as a document (hides nav, footer, Shopify chrome; shows only the form document). This lets customers save a PDF copy if needed.

---

## Verification

1. Run `shopify theme dev --store ywbx1x-1n.myshopify.com`
2. Create a new Shopify page in Admin → Pages, set template to `order-form`
3. In Admin → Navigation → Main menu, rename "Catalog" to "Order Form" and point to the new page
4. Open `localhost:9292` — confirm the nav link reads "Order Form"
5. Open the order form page — confirm all three sections render correctly
6. Toggle Quote / Order — confirm card highlights switch and submit button label updates
7. Click "+ Add another door" — confirm a new row appears with correct row number
8. Fill and submit the form — confirm a confirmation message appears and the submission arrives in store email
9. Print the page — confirm only the form document prints, no site chrome
