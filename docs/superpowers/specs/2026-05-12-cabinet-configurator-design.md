# Cabinet Configurator — Design Spec

## Context

A client is using the Oxford Wood Works Shopify template to sell custom baseball card storage cabinets. Each cabinet has adjustable dimensions, configurable drawers, and finish options. Customers build their cabinet on the website, add to cart, and the order flows to the cabinet shop who enters it into Mozaik (cabinet design software) which drives a CNC machine.

The immediate goal is Phase 1 infrastructure: a working configurator page that takes orders. Phases 2 and 3 (Mozaik file automation, full app) are deferred until the client confirms Mozaik's import format and field naming requirements.

---

## Design Decisions

### UX Approach
- **3-panel layout**: left panel (options), centre (live 2D cabinet preview), right (live spec + price + Add to Cart)
- **Preset options only** — 4–5 choices per category (width, height, depth, finish, drawer types). No free-form input. Keeps it "customisable but easy to use."
- **Drag-and-drop cabinet builder**: customer drags drawer modules from a palette into the cabinet preview. Drawers reorderable by dragging, removable with ×. Drop zone at bottom for adding.
- **Live price counter**: updates instantly as dimensions, finish, and drawers are changed.
- **Image-backed finish swatches**: actual wood grain photos, not colour squares. Finish images stored as metafield image URLs.
- **Premium dark-gold aesthetic**: inherits theme color scheme (`#1c1c1c` background, `#c9a96e` accent). Fully re-skinnable per client via theme settings.

### Infrastructure Approach
- **Shopify native** — no backend server. Configurator lives entirely in a Liquid section. No external app dependency.
- **Metafield-driven** — all product options defined in Shopify metafields. Merchant updates options, pricing, and images in Shopify admin. Zero code changes needed for content updates.
- **Line item properties** — customer's configuration stored as structured properties on the cart line item. Travels with the Shopify order.
- **Formatted order email** — Phase 1 Mozaik delivery. Order notification email displays a clean cabinet spec the cabinet shop reads and enters into Mozaik manually.
- **SortableJS** for drag-and-drop (~16kb, no jQuery dependency).

### Field Naming
We own the naming convention. Line item property names are chosen for clarity. When Phase 2 automation is built, a single mapping layer in the backend translates our names to whatever Mozaik's import format requires. The client does not need to reconfigure Mozaik for Phase 1.

---

## Metafield Schema

**Namespace: `cabinet_config`**

| Field | Type | Example Value |
|-------|------|---------------|
| `available_widths` | JSON list | `[{"label":"18\"","value":18,"price_add":0}, ...]` |
| `available_heights` | JSON list | `[{"label":"24\"","value":24,"price_add":0}, ...]` |
| `available_depths` | JSON list | `[{"label":"10\"","value":10,"price_add":0}, ...]` |
| `available_finishes` | JSON list | `[{"id":"oak","label":"Oak","image":"url","price_add":25}, ...]` |
| `drawer_types` | JSON list | `[{"id":"standard","label":"Standard Drawer","height_in":3,"price":45,"image":"url"}, ...]` |
| `base_price` | Decimal | `149.00` |
| `max_drawers` | Integer | `6` |

**Line Item Properties (saved on Add to Cart):**

| Property | Example Value |
|----------|---------------|
| `_cabinet_width` | `18` |
| `_cabinet_height` | `36` |
| `_cabinet_depth` | `12` |
| `_cabinet_finish` | `oak` |
| `_cabinet_finish_label` | `Oak` |
| `_cabinet_drawer_count` | `4` |
| `_cabinet_drawers` | `[{"pos":1,"type":"standard","h":3},{"pos":2,"type":"standard","h":3},{"pos":3,"type":"deep","h":6},{"pos":4,"type":"standard","h":3}]` |
| `_cabinet_price` | `349.00` |

Properties prefixed `_` are hidden from the public cart display but fully visible in the Shopify order admin.

---

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `sections/cabinet-configurator.liquid` | Create | Main section — HTML, CSS, inline JS |
| `templates/page.cabinet-configurator.json` | Create | Page template that uses the section |
| Shopify Admin → Custom Data → Metafields | Configure | Define `cabinet_config` metafield definitions |
| Shopify Admin → Notifications → Order confirmation | Modify | Format the Mozaik spec block in order emails |

No existing files are modified. The configurator is self-contained.

---

## Build Sequence

### Step 1 — Define Metafield Schema
- In Shopify Admin → Settings → Custom Data → Products, create all `cabinet_config` metafield definitions
- Create one test product ("Baseball Card Cabinet") and populate with placeholder values: 4 widths, 4 heights, 3 depths, 4 finishes (with image URLs), 3 drawer types
- Set `base_price` and `max_drawers`

### Step 2 — Page Template + Section Shell
- Create `templates/page.cabinet-configurator.json` — minimal JSON wrapper pointing to the `cabinet-configurator` section
- Create `sections/cabinet-configurator.liquid` — 3-panel HTML structure with scoped CSS
- Assign the template to a new Shopify page ("Build Your Cabinet")
- Assign the test product to that page via a section setting

### Step 3 — Options UI (Left Panel)
- JS reads `product.metafields.cabinet_config` values
- Renders pill button groups for width, height, depth (one active at a time)
- Renders image-backed finish swatches
- Selecting any option updates the spec panel and recalculates price
- Price formula: `base_price + width_price_add + height_price_add + depth_price_add + finish_price_add + sum(drawer prices)`

### Step 4 — Drag-and-Drop Cabinet Preview (Centre Panel)
- Load SortableJS from CDN (or copy to `assets/sortable.min.js`)
- Drawer palette: list of draggable drawer type cards, each showing label + image + price
- Cabinet preview: vertical drop zone, drawers shown to proportional scale based on `height_in`
- Interactions: drag from palette → drops into cabinet, drag within cabinet → reorders, × button → removes
- Cabinet preview header shows current dimensions as they update
- Each change triggers price recalculation and spec panel update

### Step 5 — Add to Cart + Line Item Properties
- Validate: at least one drawer added before allowing Add to Cart
- POST to Shopify Cart API (`/cart/add.js`) with `properties` field
- On success: redirect to `/cart`

### Step 6 — Order Notification Email
- In Shopify Admin → Settings → Notifications → Order confirmation
- Add a Liquid block that reads `line_item.properties` and renders the cabinet spec cleanly:
  - Dimensions block
  - Finish
  - Drawer-by-drawer breakdown with heights

---

## Verification

1. Visit the configurator page — options render from metafields (not hardcoded)
2. Change a width — spec panel updates, price recalculates
3. Change a finish — swatch highlights, finish label updates in spec panel
4. Drag a drawer into cabinet — preview updates proportionally, price increments
5. Drag drawers to reorder — order reflects in spec panel
6. Remove a drawer with × — preview and price update
7. Click Add to Cart — product appears in cart
8. In Shopify Admin → view the order — all `_cabinet_*` properties visible
9. Check order confirmation email — formatted spec is present and readable
10. Update a metafield value (e.g. add a new width) — configurator reflects it without code changes

---

## Phase 2 & 3 Notes (parked)

- **Phase 2** (semi-automated Mozaik file): build when client confirms Mozaik's import format (CSV/XML field names). Serverless function receives Shopify order webhook, reads line item properties, generates Mozaik-compatible file, emails or FTPs to cabinet shop.
- **Phase 3** (full app + order dashboard): only if order volume justifies it and Mozaik has a direct API.
- **Field name mapping**: single mapping function in Phase 2 backend translates `_cabinet_width` → Mozaik's expected field name. Nothing in Phase 1 changes.
- **Action item**: ask client what exact field names Mozaik uses in its import format before starting Phase 2.
