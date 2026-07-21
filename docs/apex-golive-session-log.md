# Apex Archive Go-Live — Session Resume Log

> **🎉 LIVE as of 2026-07-16.** The Apex Archive is public at **https://theapexarchive.com**
> (HTTPS, no password). Only open item: **step 8 — a real test order** (Nick/Devon to run from his
> end shortly). Everything else below is ✅. The domain wall is gone.

## Context (why we're here)
Nick (the buyer) was trying to take The Apex Archive live and was stuck on the **domain cutover**.
On **2026-07-16**, working over TeamViewer into Devon's machine (Devon's own Shopify login has full
admin on the Apex store), we completed the whole go-live: fixed the GoDaddy DNS, connected the domain
in Shopify as primary, SSL provisioned, and turned the store password off. Verified the live store is
served by Shopify over HTTPS (direct request to `23.227.38.65` with Host `theapexarchive.com` → HTTP
200 with Shopify cookies + the theme's `apex-archive.css`). The only step left is a real test order.
NOTE: the claude.ai Shopify **connector** still needs interactive re-auth to READ store internals via
MCP — but all the go-live work was done in the Shopify admin + GoDaddy web UIs, so it didn't matter.

## Key facts / IDs
- Apex Archive dev store: **`ywbx1x-1n.myshopify.com`** (GitHub repo `dhodgeman90-cell/Website-Sandbox-`)
- Custom domain: **TheApexArchive.com**, registered at **GoDaddy**, currently showing a GoDaddy
  "Launching Soon" builder page.
- Store contact/sender email target: **ApexCardArchive@gmail.com**
- Handoff checklist sent to Nick: `docs/apex-archive-owner-handoff-checklist.md` (8 steps)
- Note: the Shopify MCP session had been pointed at the **Plank & Panel** store, not Apex — it must
  be switched to `ywbx1x-1n` before any reads reflect Apex.

## Confirmed status (updated 2026-07-16 — GO-LIVE DAY)
| # | Checklist step | Status | Evidence |
|---|---|---|---|
| — | Store build | ✅ Done | Live + public; Cabinet $569, Backstop 12-pack $10, builder works |
| 1–2 | Ownership transfer to Nick | ⬜ Not done yet | Devon's login still has full admin; billing still on Devon's card. Separate handoff — does NOT block go-live |
| 3 | Plan / billing | ✅ Paid & active | **Basic** plan, $1/mo promo until **Aug 3 2026** (then $39). Currently on **Devon's** card (moves to Nick at handoff) |
| 4 | Activate Shopify Payments | ✅ Active | Payments screen shows set up / done — checkout can take real money |
| 5 | Sender email + click verify link | ❓ Not checked this session | Target sender = `ApexCardArchive@gmail.com`; verify in Settings → Notifications. Low priority, doesn't block orders |
| **6** | Connect TheApexArchive.com | ✅ **DONE 2026-07-16** | GoDaddy DNS fixed (A `@`→`23.227.38.65`, AAAA `@`→`2620:0127:f00f:5::`, CNAME `www`→`shops.myshopify.com`); connected in Shopify as **primary**; SSL provisioned; verified serving live over HTTPS |
| 7 | Turn off password | ✅ Off | Online Store shows **Public**; store open to the world |
| 8 | Test order | ⬜ **Only open item** | Nick/Devon to place a real order (cheapest = Backstop 12-pack $10) + refund, confirm it lands in Orders |

## How step 6 was fixed (2026-07-16, for the record)
GoDaddy DNS had a single **A `@` = "WebsiteBuilder Site"** record (GoDaddy's "Launching Soon"
builder — the thing that had been blocking the connect) plus a **CNAME `www` → theapexarchive.com`.
Fix that worked:
- **Edited** the A `@` record → `23.227.38.65` (killed the coming-soon page)
- **Edited** the CNAME `www` → `shops.myshopify.com`
- **Added** AAAA `@` → `2620:0127:f00f:5::`
- Left NS / SOA / `_domainconnect` / `_dmarc` alone
- Then in Shopify admin: **Settings → Domains → Connect existing domain → set primary**
- Gotcha seen: an **outside web fetch still showed "Launching Soon"** for a bit — that was **stale
  DNS cache** (old 1-hour TTL), NOT a real failure. Confirmed real store live via a direct
  `curl --resolve theapexarchive.com:443:23.227.38.65` → HTTP 200 + Shopify cookies + `apex-archive.css`.

## Still open / follow-ups
- **Test order (step 8)** — the only go-live item left.
- **Ownership transfer to Nick (steps 1–2)** + move billing to Nick's card — the real remaining
  project. Use the handoff playbook in `docs/` when Nick's ready.
- **Sender email verify (step 5)** — confirm `ApexCardArchive@gmail.com` in Settings → Notifications.
- `docs/nick-next-steps.md` (the GoDaddy walkthrough) is now moot for the domain — done.

## If you need MCP reads of the store later
The claude.ai Shopify connector still needs interactive re-auth on `ywbx1x-1n` (claude.ai → connector
settings) before `get-shop-info` / `graphql_query` will read Apex. Not needed for anything above —
all go-live work was done in the Shopify admin + GoDaddy web UIs.
