# Order Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a branded, submittable order/quote form page for Oxford Wood Works and rename the "Catalog" nav link to "Order Form".

**Architecture:** Two new files — a minimal JSON page template and a self-contained Liquid section containing all HTML, CSS, and JavaScript. Submissions use Shopify's native `{% form 'contact' %}` tag; JavaScript assembles the order table rows into the `contact[body]` field just before submit.

**Tech Stack:** Shopify Liquid, Shopify contact form API, vanilla JS (inline), CSS (inline `<style>` block)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `templates/page.order-form.json` | Assigns the `order-form` section to the page template |
| Create | `sections/order-form.liquid` | All HTML, CSS, JS for the order form document |

Two manual Admin steps follow the code work (Tasks 3–4).

---

### Task 1: Create the page template

**Files:**
- Create: `templates/page.order-form.json`

- [ ] **Step 1: Create the template file**

Create `templates/page.order-form.json` with this exact content:

```json
{
  "sections": {
    "main": {
      "type": "order-form",
      "settings": {}
    }
  },
  "order": ["main"]
}
```

- [ ] **Step 2: Verify it looks right**

Open `templates/page.order-form.json`. Confirm it has `"type": "order-form"` — this must exactly match the `{% schema %}` name you'll add in Task 2.

- [ ] **Step 3: Commit**

```powershell
git add templates/page.order-form.json
git commit -m "Add order-form page template"
```

---

### Task 2: Create the order form section

**Files:**
- Create: `sections/order-form.liquid`

This section is one self-contained file: markup → `<style>` → `<script>` → `{% schema %}`.

- [ ] **Step 1: Create `sections/order-form.liquid`**

Create the file with this complete content:

```liquid
{%- if contact.posted_successfully? -%}
  <div class="oww-form-success">
    <div class="oww-form-success__inner">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#c9a96e" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <h2 class="oww-form-success__title">Thank you — we've received your submission.</h2>
      <p class="oww-form-success__body">We'll review it and be in touch within 1–2 business days. If you have urgent questions, email <a href="mailto:{{ shop.email }}">{{ shop.email }}</a>.</p>
    </div>
  </div>
{%- else -%}

<div class="oww-order-form-page">
  <div class="oww-order-form-doc">

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

    <!-- ── GOLD RULE ──────────────────────────────────── -->
    <div class="oww-form-gold-rule"></div>

    {% form 'contact' %}

      <!-- Hidden field: assembled body (written by JS on submit) -->
      <input type="hidden" name="contact[body]" id="owwFormBody">

      <!-- ── REQUEST TYPE TOGGLE ────────────────────────── -->
      <div class="oww-form-toggle">
        <p class="oww-form-toggle__label">I am submitting a:</p>
        <div class="oww-form-toggle__grid">
          <div class="oww-form-toggle__card oww-form-toggle__card--active"
               data-value="Quote Request"
               onclick="owwSelectType(this)">
            <div class="oww-form-toggle__radio oww-form-toggle__radio--filled"></div>
            <div>
              <p class="oww-form-toggle__name">Quote Request</p>
              <p class="oww-form-toggle__desc">I'd like a price estimate before committing</p>
            </div>
          </div>
          <div class="oww-form-toggle__card"
               data-value="Place an Order"
               onclick="owwSelectType(this)">
            <div class="oww-form-toggle__radio"></div>
            <div>
              <p class="oww-form-toggle__name">Place an Order</p>
              <p class="oww-form-toggle__desc">I'm ready to go — process my order</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── FORM BODY ──────────────────────────────────── -->
      <div class="oww-form-body">

        <!-- Section 1: Customer Details -->
        <div class="oww-form-section">
          <div class="oww-form-section__heading">
            <div class="oww-form-section__num">1</div>
            <p class="oww-form-section__title">Customer Details</p>
            <div class="oww-form-section__rule"></div>
          </div>
          <div class="oww-customer-grid">
            <div class="oww-form-field">
              <label class="oww-form-label" for="owwName">Full Name <span class="oww-required">*</span></label>
              <input class="oww-form-input" type="text" id="owwName" name="contact[name]" required autocomplete="name">
            </div>
            <div class="oww-form-field">
              <label class="oww-form-label" for="owwCompany">Company / Business</label>
              <input class="oww-form-input" type="text" id="owwCompany" autocomplete="organization">
            </div>
            <div class="oww-form-field">
              <label class="oww-form-label" for="owwEmail">Email Address <span class="oww-required">*</span></label>
              <input class="oww-form-input" type="email" id="owwEmail" name="contact[email]" required autocomplete="email">
            </div>
            <div class="oww-form-field">
              <label class="oww-form-label" for="owwPhone">Phone Number</label>
              <input class="oww-form-input" type="tel" id="owwPhone" name="contact[phone]" autocomplete="tel">
            </div>
            <div class="oww-form-field oww-form-field--full">
              <label class="oww-form-label" for="owwAddress">Delivery Address</label>
              <textarea class="oww-form-input oww-form-textarea" id="owwAddress" rows="2" autocomplete="street-address"></textarea>
            </div>
          </div>
        </div>

        <!-- Section 2: Door Details -->
        <div class="oww-form-section">
          <div class="oww-form-section__heading">
            <div class="oww-form-section__num">2</div>
            <p class="oww-form-section__title">Door Details</p>
            <div class="oww-form-section__rule"></div>
          </div>
          <table class="oww-order-table">
            <thead>
              <tr>
                <th class="oww-order-table__num-col">#</th>
                <th class="oww-order-table__qty-col">Qty</th>
                <th class="oww-order-table__style-col">Door Style</th>
                <th class="oww-order-table__dim-col">Width (mm)</th>
                <th class="oww-order-table__dim-col">Height (mm)</th>
              </tr>
            </thead>
            <tbody id="owwOrderRows">
              {%- for i in (1..5) -%}
              <tr class="oww-order-row">
                <td class="oww-order-row__num">{{ i }}</td>
                <td><input class="oww-form-input oww-order-input" type="number" min="1" placeholder="1"></td>
                <td>
                  <select class="oww-form-input oww-order-select">
                    <option value="">Select style…</option>
                    <option value="S001 — Shaker">S001 — Shaker</option>
                    <option value="S002 — Bevel Shaker">S002 — Bevel Shaker</option>
                    <option value="S003 — Double Shaker">S003 — Double Shaker</option>
                    <option value="S004 — Slim Shaker">S004 — Slim Shaker</option>
                    <option value="S005 — Skinny 150V">S005 — Skinny 150V</option>
                    <option value="S006 — Skinny Bead 125">S006 — Skinny Bead 125</option>
                  </select>
                </td>
                <td><input class="oww-form-input oww-order-input" type="number" min="1" placeholder="e.g. 600"></td>
                <td><input class="oww-form-input oww-order-input" type="number" min="1" placeholder="e.g. 900"></td>
              </tr>
              {%- endfor -%}
            </tbody>
          </table>
          <button type="button" class="oww-add-row-btn" id="owwAddRowBtn" onclick="owwAddRow()">+ Add another door</button>
        </div>

        <!-- Section 3: Notes -->
        <div class="oww-form-section">
          <div class="oww-form-section__heading">
            <div class="oww-form-section__num">3</div>
            <p class="oww-form-section__title">Notes &amp; Special Instructions</p>
            <div class="oww-form-section__rule"></div>
          </div>
          <textarea class="oww-form-input oww-form-textarea" id="owwNotes" rows="4"
            placeholder="Any additional requirements, finish preferences, or special instructions…"></textarea>
        </div>

        <!-- Submit area -->
        <div class="oww-form-submit-area">
          <p class="oww-form-helper">
            We'll review your request and be in touch within 1–2 business days.<br>
            Questions? Email <a class="oww-form-helper__link" href="mailto:{{ shop.email }}">{{ shop.email }}</a>
          </p>
          <button type="submit" class="oww-form-submit-btn" id="owwSubmitBtn">
            Submit Quote Request →
          </button>
        </div>

      </div>
    {% endform %}

    <!-- ── FOOTER STRIP ───────────────────────────────── -->
    <div class="oww-form-footer">
      <span class="oww-form-footer__text">OXFORD WOOD WORKS</span>
      <div class="oww-form-footer__rule"></div>
      <span class="oww-form-footer__text">CNC-CUT MDF DOORS</span>
    </div>

  </div>
</div>

{%- endif -%}

<style>
  /* ── Page wrapper ──────────────────────────────────── */
  .oww-order-form-page {
    background: #f0ede8;
    min-height: 80vh;
    padding: 48px 20px 64px;
  }

  /* ── Document card ─────────────────────────────────── */
  .oww-order-form-doc {
    background: #ffffff;
    max-width: 860px;
    margin: 0 auto;
    box-shadow: 0 4px 32px rgba(0, 0, 0, 0.13);
    font-family: 'Inter', Arial, sans-serif;
  }

  /* ── Header ────────────────────────────────────────── */
  .oww-form-header {
    background: #1c1c1c;
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .oww-form-header__logo {
    display: block;
    max-width: 160px;
    height: auto;
  }

  .oww-form-header__url {
    font-size: 10px;
    color: #888;
    margin: 6px 0 0;
    letter-spacing: 0.5px;
  }

  .oww-form-header__order-label {
    font-size: 26px;
    font-weight: 800;
    color: #f0ede8;
    letter-spacing: 4px;
    text-transform: uppercase;
    text-align: right;
    margin: 0;
  }

  .oww-form-header__sub {
    font-size: 11px;
    color: #c9a96e;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-align: right;
    margin: 4px 0 0;
  }

  /* ── Gold rule ─────────────────────────────────────── */
  .oww-form-gold-rule {
    height: 3px;
    background: linear-gradient(to right, #c9a96e, #e8c88a, #c9a96e);
  }

  /* ── Request type toggle ───────────────────────────── */
  .oww-form-toggle {
    padding: 22px 36px;
    border-bottom: 1px solid #f0f0f0;
  }

  .oww-form-toggle__label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #888;
    text-transform: uppercase;
    margin: 0 0 12px;
  }

  .oww-form-toggle__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .oww-form-toggle__card {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    padding: 14px 18px;
    background: #fafafa;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .oww-form-toggle__card--active {
    background: #1c1c1c;
    border-color: #1c1c1c;
  }

  .oww-form-toggle__card--active .oww-form-toggle__name {
    color: #f0ede8;
  }

  .oww-form-toggle__card--active .oww-form-toggle__desc {
    color: #888;
  }

  .oww-form-toggle__radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #ccc;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
  }

  .oww-form-toggle__radio--filled {
    border-color: #c9a96e;
    background: #c9a96e;
    box-shadow: inset 0 0 0 3px #1c1c1c;
  }

  .oww-form-toggle__name {
    font-size: 13px;
    font-weight: 700;
    color: #333;
    letter-spacing: 0.3px;
    margin: 0 0 3px;
  }

  .oww-form-toggle__desc {
    font-size: 10px;
    color: #aaa;
    margin: 0;
  }

  /* ── Form body ─────────────────────────────────────── */
  .oww-form-body {
    padding: 28px 36px;
  }

  /* ── Section heading ───────────────────────────────── */
  .oww-form-section {
    margin-bottom: 32px;
  }

  .oww-form-section__heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }

  .oww-form-section__num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #1c1c1c;
    color: #c9a96e;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .oww-form-section__title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #1c1c1c;
    text-transform: uppercase;
    white-space: nowrap;
    margin: 0;
  }

  .oww-form-section__rule {
    flex: 1;
    height: 1px;
    background: #e0e0e0;
  }

  /* ── Customer grid ─────────────────────────────────── */
  .oww-customer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .oww-form-field--full {
    grid-column: 1 / -1;
  }

  /* ── Form fields ───────────────────────────────────── */
  .oww-form-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .oww-required {
    color: #c9a96e;
  }

  .oww-form-input {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
    background: #fafafa;
    font-family: 'Inter', Arial, sans-serif;
    font-size: 13px;
    color: #1c1c1c;
    box-sizing: border-box;
    transition: border-color 0.15s;
    -webkit-appearance: none;
    appearance: none;
  }

  .oww-form-input:focus {
    outline: none;
    border-color: #c9a96e;
    background: #fff;
  }

  .oww-form-textarea {
    resize: vertical;
    min-height: 56px;
  }

  /* ── Order table ───────────────────────────────────── */
  .oww-order-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .oww-order-table thead tr {
    background: #1c1c1c;
  }

  .oww-order-table thead th {
    padding: 10px 12px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #c9a96e;
    text-transform: uppercase;
  }

  .oww-order-table__num-col  { width: 8%;  }
  .oww-order-table__qty-col  { width: 10%; }
  .oww-order-table__style-col{ width: 36%; }
  .oww-order-table__dim-col  { width: 23%; }

  .oww-order-row {
    border-bottom: 1px solid #f0f0f0;
  }

  .oww-order-row:nth-child(even) {
    background: #fafafa;
  }

  .oww-order-row td {
    padding: 8px 12px;
  }

  .oww-order-row__num {
    color: #bbb;
    font-size: 11px;
    font-weight: 600;
  }

  .oww-order-input {
    padding: 6px 8px;
    font-size: 12px;
  }

  .oww-order-select {
    padding: 6px 8px;
    font-size: 12px;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }

  /* ── Add row button ────────────────────────────────── */
  .oww-add-row-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    font-family: 'Inter', Arial, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #c9a96e;
    cursor: pointer;
    letter-spacing: 0.3px;
    margin-top: 4px;
  }

  .oww-add-row-btn:hover {
    color: #b8934a;
  }

  /* ── Submit area ───────────────────────────────────── */
  .oww-form-submit-area {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    gap: 20px;
  }

  .oww-form-helper {
    font-size: 11px;
    color: #aaa;
    line-height: 1.6;
    margin: 0;
  }

  .oww-form-helper__link {
    color: #c9a96e;
    text-decoration: none;
  }

  .oww-form-submit-btn {
    flex-shrink: 0;
    background: #1c1c1c;
    color: #f0ede8;
    border: none;
    padding: 14px 32px;
    font-family: 'Inter', Arial, sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 2px;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .oww-form-submit-btn:hover {
    background: #2e2e2e;
  }

  /* ── Footer strip ──────────────────────────────────── */
  .oww-form-footer {
    background: #1c1c1c;
    padding: 12px 36px;
    display: flex;
    align-items: center;
  }

  .oww-form-footer__text {
    font-size: 9px;
    color: #555;
    letter-spacing: 1.5px;
    white-space: nowrap;
  }

  .oww-form-footer__rule {
    flex: 1;
    height: 1px;
    background: #2e2e2e;
    margin: 0 16px;
  }

  /* ── Success state ─────────────────────────────────── */
  .oww-form-success {
    background: #f0ede8;
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
  }

  .oww-form-success__inner {
    text-align: center;
    max-width: 480px;
  }

  .oww-form-success__title {
    font-size: 22px;
    font-weight: 700;
    color: #1c1c1c;
    margin: 20px 0 12px;
  }

  .oww-form-success__body {
    font-size: 14px;
    color: #555;
    line-height: 1.7;
  }

  .oww-form-success__body a {
    color: #c9a96e;
  }

  /* ── Responsive ────────────────────────────────────── */
  @media (max-width: 640px) {
    .oww-order-form-page {
      padding: 0;
    }
    .oww-form-header {
      padding: 20px;
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
    .oww-form-header__order-label,
    .oww-form-header__sub {
      text-align: center;
    }
    .oww-form-toggle {
      padding: 16px 20px;
    }
    .oww-form-toggle__grid {
      grid-template-columns: 1fr;
    }
    .oww-form-body {
      padding: 20px;
    }
    .oww-customer-grid {
      grid-template-columns: 1fr;
    }
    .oww-form-field--full {
      grid-column: 1;
    }
    .oww-order-table thead th,
    .oww-order-row td {
      padding: 8px 6px;
    }
    .oww-form-submit-area {
      flex-direction: column;
      align-items: flex-start;
    }
    .oww-form-submit-btn {
      width: 100%;
      text-align: center;
    }
    .oww-form-footer {
      padding: 12px 20px;
    }
  }

  /* ── Print ─────────────────────────────────────────── */
  @media print {
    header,
    footer,
    nav,
    .shopify-section-group-header-group,
    .shopify-section-group-footer-group,
    .oww-add-row-btn,
    .oww-form-submit-area {
      display: none !important;
    }
    .oww-order-form-page {
      background: none;
      padding: 0;
    }
    .oww-order-form-doc {
      box-shadow: none;
      max-width: 100%;
    }
  }
</style>

<script>
  // ── Toggle: Quote Request / Place an Order ──────────────────────
  function owwSelectType(card) {
    const cards = document.querySelectorAll('.oww-form-toggle__card');
    const radios = document.querySelectorAll('.oww-form-toggle__radio');
    const btn = document.getElementById('owwSubmitBtn');
    const selectedValue = card.getAttribute('data-value');

    cards.forEach(function(c) {
      c.classList.remove('oww-form-toggle__card--active');
    });
    radios.forEach(function(r) {
      r.classList.remove('oww-form-toggle__radio--filled');
    });

    card.classList.add('oww-form-toggle__card--active');
    card.querySelector('.oww-form-toggle__radio').classList.add('oww-form-toggle__radio--filled');

    btn.textContent = selectedValue === 'Place an Order'
      ? 'Submit Order →'
      : 'Submit Quote Request →';
  }

  // ── Add Row ─────────────────────────────────────────────────────
  function owwAddRow() {
    var tbody = document.getElementById('owwOrderRows');
    var rows = tbody.querySelectorAll('.oww-order-row');
    if (rows.length >= 20) {
      document.getElementById('owwAddRowBtn').style.display = 'none';
      return;
    }
    var lastRow = rows[rows.length - 1];
    var newRow = lastRow.cloneNode(true);
    var newNum = rows.length + 1;
    newRow.querySelector('.oww-order-row__num').textContent = newNum;
    newRow.querySelectorAll('input').forEach(function(inp) { inp.value = ''; });
    newRow.querySelectorAll('select').forEach(function(sel) { sel.selectedIndex = 0; });
    tbody.appendChild(newRow);
    if (rows.length + 1 >= 20) {
      document.getElementById('owwAddRowBtn').style.display = 'none';
    }
  }

  // ── Submit: assemble contact[body] ──────────────────────────────
  (function() {
    var form = document.querySelector('form[action="/contact#ContactForm"]');
    if (!form) return;

    form.addEventListener('submit', function() {
      var requestType = (document.querySelector('.oww-form-toggle__card--active') || {})
        .getAttribute('data-value') || 'Quote Request';
      var company = (document.getElementById('owwCompany') || {}).value || '';
      var address = (document.getElementById('owwAddress') || {}).value || '';
      var notes   = (document.getElementById('owwNotes')   || {}).value || '';

      var orderLines = [];
      var rows = document.querySelectorAll('.oww-order-row');
      rows.forEach(function(row, idx) {
        var inputs  = row.querySelectorAll('input[type="number"]');
        var select  = row.querySelector('select');
        var qty     = inputs[0] ? inputs[0].value.trim() : '';
        var style   = select   ? select.value.trim()      : '';
        var width   = inputs[1] ? inputs[1].value.trim()  : '';
        var height  = inputs[2] ? inputs[2].value.trim()  : '';
        if (!qty && !style && !width && !height) return;
        orderLines.push(
          'Row ' + (idx + 1) + ': Qty ' + (qty || '—') +
          ' | ' + (style || '—') +
          ' | ' + (width || '—') + 'mm × ' + (height || '—') + 'mm'
        );
      });

      var body =
        'REQUEST TYPE: ' + requestType + '\n\n' +
        'CUSTOMER DETAILS\n' +
        'Company: ' + (company || '—') + '\n' +
        'Delivery Address: ' + (address || '—') + '\n\n' +
        'DOOR ORDER\n' +
        (orderLines.length ? orderLines.join('\n') : '(no door rows filled in)') + '\n\n' +
        'NOTES\n' +
        (notes || '(none)');

      document.getElementById('owwFormBody').value = body;
    });
  })();
</script>

{% schema %}
{
  "name": "Order Form",
  "tag": "section",
  "class": "section",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 2: Verify the file saved correctly**

Open `sections/order-form.liquid` and confirm:
- `{% form 'contact' %}` is present (not a raw `<form>` tag)
- `{% schema %}` block at the bottom has `"name": "Order Form"`
- `"type": "order-form"` in `templates/page.order-form.json` matches the file name `order-form.liquid` ✓

- [ ] **Step 3: Commit**

```powershell
git add sections/order-form.liquid
git commit -m "Add order form section with contact form, toggle, and order table"
```

- [ ] **Step 4: Push to GitHub (triggers Shopify sync)**

```powershell
git push origin main
```

Wait ~30 seconds for GitHub → Shopify sync to complete.

---

### Task 3: Create the Shopify page in Admin

These are manual steps in the browser — no code involved.

- [ ] **Step 1: Open Shopify Admin → Pages**

Go to: `https://admin.shopify.com/store/ywbx1x-1n/pages`

- [ ] **Step 2: Create a new page**

Click **Add page** and fill in:
- Title: `Order Form`
- Content: leave blank
- Theme template: scroll down to **"Theme template"** and select `order-form` from the dropdown

Click **Save**.

- [ ] **Step 3: Note the page URL**

After saving, the page URL will be `/pages/order-form`. Copy the full URL — you'll need it in Task 4.

---

### Task 4: Rename the nav link in Admin

- [ ] **Step 1: Open Navigation**

Go to: `https://admin.shopify.com/store/ywbx1x-1n/menus`

Click **Main menu**.

- [ ] **Step 2: Find and update the Catalog link**

Find the **Catalog** link in the list. Click the pencil/edit icon on it and:
- Change the **Name** from `Catalog` to `Order Form`
- Change the **Link** to the page you just created (`/pages/order-form`)

Click **Save menu**.

---

### Task 5: Verify end-to-end

- [ ] **Step 1: Start local preview**

```powershell
shopify theme dev --store ywbx1x-1n.myshopify.com
```

Open `http://localhost:9292`.

- [ ] **Step 2: Check the nav link**

The header navigation should now read **Order Form** (not Catalog).

- [ ] **Step 3: Open the form page**

Click the Order Form nav link. Confirm:
- Dark branded header with OWW logo left, "ORDER FORM / CNC-CUT MDF DOORS" right
- Gold gradient rule below header
- Quote Request / Place an Order toggle cards (Quote selected by default)
- Customer Details section with all 5 fields
- Door Details table with 5 rows and dropdown in the Style column
- Notes section
- Submit area with shop email and button reading "Submit Quote Request →"
- Dark footer strip

- [ ] **Step 4: Test the toggle**

Click **Place an Order**. Confirm:
- The card highlights dark
- The Submit button changes to "Submit Order →"

Click **Quote Request**. Confirm it switches back.

- [ ] **Step 5: Test Add Row**

Click **+ Add another door**. Confirm a 6th row appears with row number 6 and all fields empty.

- [ ] **Step 6: Submit a test form**

Fill in:
- Name: `Test Customer`
- Email: your own email address
- Qty: `2`, Style: `S001 — Shaker`, Width: `600`, Height: `900`
- Notes: `Test submission`

Click **Submit Quote Request →**. Confirm:
- The page shows the green-check success message
- You receive an email at the store's notification address containing the formatted order body

- [ ] **Step 7: Test print layout**

Press `Ctrl+P` (or `Cmd+P`) on the form page. Confirm only the document card prints — no nav, no Shopify header, no footer.
