# The Apex Archive — Store Owner Handoff Checklist

---

## 1. Confirm your Shopify login
- [ ] You already have a Shopify account — just send me the email address it's under, so I can add you to the store and start the ownership transfer.

*Why: I use your account's email to send the staff invite and transfer ownership to you.*

## 2. Accept the store
- [ ] Accept the **staff invite** email from Shopify.
- [ ] Accept the **ownership transfer** — this makes you the official store owner.

*Why: once you're the owner, the money, taxes, and account are all in your name (not mine).*

> **Keeping me on (so I can help you):** after the transfer I'll stay on your store as a staff member — or set up free **collaborator access** through my Shopify Partner account — so I can jump in whenever you need changes. Just keep me added / approve the access request; you can remove it anytime.

## 3. Put your billing on the account
- [ ] **Settings → Plan** → confirm the plan and add **your** payment method (card).

*Why: the monthly Shopify subscription bills the owner — that's you now.*

## 4. Turn on payments
- [ ] **Settings → Payments → Activate Shopify Payments** → enter your business info, tax ID, and **bank account** (this is where your sales money is deposited).
- [ ] *(Optional)* Add **PayPal** as a second checkout button.
- [ ] *(Optional)* Toggle on **Shop Pay / Apple Pay / Google Pay** and **Shop Pay Installments** (buy-now-pay-later).

**Your payment options:**

| Option | What customers can use | Rough cost |
|--------|------------------------|------------|
| **Shopify Payments** (main) | All major cards + Shop Pay + Apple/Google Pay | ~2.4–2.9% + 30¢ per sale |
| **PayPal** (optional) | PayPal balance + PayPal-processed cards | ~3.49% + 49¢ per sale |

*Recommended: turn on Shopify Payments as your primary, and add PayPal as a backup button.*

## 5. Set your store email to ApexCardArchive@gmail.com
- [ ] **Settings → Notifications → Sender email** → enter `ApexCardArchive@gmail.com`.
- [ ] ⚠️ **Open the ApexCardArchive@gmail.com inbox and click the verification link Shopify sends you.** The email address will **not** start working until you click that link.
- [ ] **Settings → Store details → Store contact email** → set the same address.

*Why: this is where your **Contact form** and **Custom Order form** submissions are delivered.
(Newsletter / "Join our email list" signups don't go to an inbox — they show up automatically
in your **Customers** list inside Shopify.)*

## 6. Connect your domain — TheApexArchive.com
Your domain is registered at **GoDaddy**, so the DNS changes happen there.
- [ ] In Shopify: **Settings → Domains → Connect existing domain** → enter `theapexarchive.com`.
- [ ] In **GoDaddy → Manage DNS**, set these records (delete any old parking/forwarding records that conflict):
  - **A record** — Host `@` → `23.227.38.65`
  - **AAAA record** — Host `@` → `2620:0127:f00f:5::`
  - **CNAME record** — Host `www` → `shops.myshopify.com`
- [ ] Back in Shopify → **Verify connection** (usually works within a couple hours, up to 48).
- [ ] Set `theapexarchive.com` as your **primary domain** and turn on **"Redirect all traffic to this domain."**

*Why: this makes your store load at your own web address, with a secure padlock (Shopify adds the SSL certificate automatically).*

## 7. Go live
- [ ] **Online Store → Preferences** → **uncheck the password protection** when you're ready for real customers.

## 8. Test before you announce it
- [ ] Visit **https://theapexarchive.com** — it loads with a padlock (secure).
- [ ] Build a cabinet → **Add to cart** → check out → confirm the price is correct. Place one small **test order**, then **refund** it from the Orders page.
- [ ] Submit a quick **test message** through the Contact form → confirm it arrives at ApexCardArchive@gmail.com.

---

### Good to know
- **Configured cabinets charge the exact price automatically** — the configurator is wired to
  real product pricing, so checkout always matches what the customer designed (no manual quotes).
- **Extra Apex Backstops** are sold in packs of 12 ($10/pack) and add to the order automatically.
- **Newsletter subscribers** build your Customers list inside Shopify — you can email them later
  with Shopify Email or a tool like Mailchimp.
