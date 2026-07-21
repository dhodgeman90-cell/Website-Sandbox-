# Getting The Apex Archive Live — Your Next Steps

Hey Nick — here's exactly where things stand and what to do next. No tech background needed;
follow it top to bottom.

## Where things stand right now

- ✅ **The store is fully built and working.** It's live and public at its Shopify web address,
  products and prices are all set, and the cabinet builder works.
- ❌ **Your real web address (TheApexArchive.com) isn't connected yet.** Right now, if you type
  `theapexarchive.com` into a browser, you get a **GoDaddy "Launching Soon" page** — not your
  store. That's the main wall between you and being live, and it's the part people most often get
  stuck on. Section B below walks you through it click by click.

## Step 1 — 30-second self-check: where are YOU stuck?

Go down this list and find the **first box you can't confidently check**. That's your spot —
tell Devon the number and he can jump straight to it.

1. ☐ You sent Devon the email your Shopify account is under, and accepted the invite / ownership
   transfer, so **you're the store owner** now.
2. ☐ **Settings → Plan** shows a paid plan on **your** card.
3. ☐ **Settings → Payments** shows **Shopify Payments turned on** with your bank + tax info.
4. ☐ **Settings → Notifications → Sender email** is `ApexCardArchive@gmail.com`, **and you
   clicked the verify link** Shopify emailed to that inbox.
5. ☐ Your domain **TheApexArchive.com is connected** and loads your store (this is the one that's
   NOT done yet — see Section B).
6. ☐ **Online Store → Preferences** — password protection is turned **off**.

If you're stuck before #5, tell Devon which number — those steps are all inside your Shopify
settings and he can screen-share you through them. If you've gotten to #5, keep reading.

---

## Section B — Connect TheApexArchive.com (the domain step)

This is the part that's blocking go-live. It has two halves: a quick setting in **Shopify**, and
the actual work in **GoDaddy** (where your domain lives).

### ⚠️ Do this FIRST — turn off GoDaddy's "Launching Soon" site
Your domain currently has GoDaddy's own website builder switched on (that's the "Launching Soon"
page). **It will fight the connection and cause it to fail** if you skip this.

1. Log in at **godaddy.com** → click your name (top right) → **My Products**.
2. Find **theapexarchive.com**. If it shows a **Website / Website Builder** attached, click into
   it and **disable / delete that website** (you're not losing anything — it's just a placeholder
   page). If you're unsure, this is a good moment to have Devon look over your shoulder.

### Half 1 — In Shopify (tell it your domain)
1. **Settings → Domains → Connect existing domain**.
2. Type `theapexarchive.com` → **Next**. Shopify will show you the records to set — they match
   the ones below.

### Half 2 — In GoDaddy (point the domain at Shopify)
1. Log in at **godaddy.com** → **My Products** → next to **theapexarchive.com** click
   **DNS** (or "Manage DNS").
2. You'll see a list of records. You're going to set these **three**, and **delete any old ones
   that conflict** (see the cleanup note after the table):

   | Type | Name / Host | Value | 
   |------|-------------|-------|
   | **A** | `@` | `23.227.38.65` |
   | **AAAA** | `@` | `2620:0127:f00f:5::` |
   | **CNAME** | `www` | `shops.myshopify.com` |

   **How to set each one:** if a record of that Type + Name already exists, click **Edit** (pencil)
   and change its Value to the one above. If it doesn't exist, click **Add** and create it.

   **Cleanup — delete these leftover GoDaddy parking records** (they're why the domain shows the
   GoDaddy page right now). Look for **A records** named `@` pointing at:
   - `76.223.105.230`
   - `13.248.243.5`

   Delete both (trash-can icon). Also delete any **Forwarding** set on the domain (in GoDaddy,
   Domain Settings → Forwarding → remove it) — forwarding overrides the records above.

3. Save.

### Half 3 — Back in Shopify (finish + make it your main address)
1. **Settings → Domains** → click **Verify connection**. DNS changes usually take a couple hours,
   sometimes up to 48 — if it's not verified immediately, that's normal; check back later.
2. Once verified, set `theapexarchive.com` as your **primary domain** and turn on
   **"Redirect all traffic to this domain."**

Shopify adds the secure padlock (SSL) automatically once it's connected — you don't do anything
for that.

---

## Step 3 — Flip the sign to "Open" and test

1. **Online Store → Preferences → uncheck password protection.** (Only do this when you're ready
   for real customers.)
2. Visit **https://theapexarchive.com** — you should see your store with a padlock.
3. Build a cabinet → add to cart → check out → confirm the price → place one small **test order**,
   then **refund** it from the Orders page.
4. Send yourself a **Contact form** message → confirm it lands in **ApexCardArchive@gmail.com**.

That's it — once the domain loads your store with a padlock and a test order goes through, you're
live. **When in doubt on any step, screenshot what you're looking at and send it to Devon** —
faster than guessing.
