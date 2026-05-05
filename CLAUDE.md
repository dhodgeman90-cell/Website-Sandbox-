# Oxford Wood Works — Claude Code Guide

## Project Overview

**Client:** Phill Anton
**Site:** Oxford Wood Works — ecommerce store selling CNC-cut MDF doors
**Designs:** Licensed from https://www.phillanton.com/pages/mdf-doors
**Permission:** Phill Anton has explicitly granted permission to reference his website and use imagery (adapted to Oxford Wood Works style)
**Aesthetic:** Modern and minimal — clean lines, generous white space, premium feel
**Owner skill level:** Beginner — always explain commands before running them

This site must be easy to manage long-term. No shortcuts. No bandaids. Do it properly or flag the issue.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Shopify Online Store 2.0 | Ecommerce platform (Dawn theme, customized) |
| GitHub | Version control — auto-synced to Shopify |
| VS Code | Code editor |
| Shopify CLI | Local theme preview and deployment |
| Claude Code | Design and development assistant |
| App Embed Blocks | How configurator + calculator are embedded (NOT raw iframes) |

**GitHub repo:** https://github.com/dhodgeman90-cell/Website-Sandbox-
**Shopify store URL:** ywbx1x-1n.myshopify.com

---

## Design System

- **Style:** Modern minimal
- **Colors:** Dark Premium palette — confirmed session 1
  - Background: `#1c1c1c` (near-black)
  - Cards/secondary: `#242424`
  - Heading text: `#f0ede8` (warm cream)
  - Body text: `#d4cfc9`
  - Accent/gold: `#c9a96e`
  - Borders: `#2e2e2e`
- **Font:** Inter (already set in theme — clean geometric sans-serif)
- **Spacing:** Generous — never crowded, never cluttered
- **Images:** Sourced from phillanton.com, adapted to Oxford Wood Works color palette
- **Buttons:** Simple, flat, no drop shadows — solid or outline style only
- **No gradients. No decorative borders. No clutter.**

---

## Directory Structure

```
/
├── CLAUDE.md                        ← this file
├── assets/                          ← CSS, JS, images, fonts
├── config/
│   └── settings_data.json           ← brand colors, fonts, theme settings
├── layout/
│   └── theme.liquid                 ← master page layout
├── sections/                        ← page sections (homepage hero, product grid, etc.)
├── snippets/                        ← reusable Liquid components
├── templates/                       ← page templates (product, collection, index, etc.)
└── docs/
    └── superpowers/
        └── specs/                   ← design documents from brainstorming sessions
```

---

## Prerequisites (One-Time Setup)

Before anything works, these must be installed:

**1. Node.js** (required for Shopify CLI)
Download from: https://nodejs.org — install the LTS version
Verify: open PowerShell and run `node --version`

**2. Shopify CLI**
```powershell
npm install -g @shopify/cli @shopify/theme
```
Verify: `shopify version`

**3. VS Code Extensions** (install via Ctrl+Shift+X)
- **Shopify Liquid** (by Shopify) — syntax highlighting + linting
- **Prettier** — code formatting
- **GitHub Pull Requests** — manage GitHub from VS Code

**4. Authenticate Shopify CLI**
```powershell
shopify auth login
```
Follow the browser prompt to log in to your Shopify account.

**5. Connect GitHub to Shopify**
1. Shopify Admin → Online Store → Themes
2. "Add theme" → "Connect from GitHub"
3. Select repo: `dhodgeman90-cell/Website-Sandbox-`
4. Connect `main` branch → live theme
5. Create a `develop` branch → connect to unpublished dev theme

---

## Starting a Session

Do this every time you work on the site:

```
1. Open PowerShell
2. Type: cd "c:\VS Code\Website Fuckery"
3. Type: code .           (VS Code opens in the right folder)
4. In the VS Code terminal: shopify theme dev --store ywbx1x-1n.myshopify.com
5. Browser opens at http://localhost:9292 — this is your live preview
6. Launch Claude Code and start working
```

---

## Common Commands

```powershell
# Live local preview (run this first every session)
shopify theme dev --store ywbx1x-1n.myshopify.com

# Push your local changes up to Shopify
shopify theme push --store ywbx1x-1n.myshopify.com

# Pull the latest theme down from Shopify
shopify theme pull --store ywbx1x-1n.myshopify.com

# Save your work to GitHub
git add .
git commit -m "short description of what you changed"
git push origin main
```

---

## App Embed Blocks

Two custom apps will be embedded in the storefront:

| App | What it does | Status |
|-----|-------------|--------|
| Door Configurator | Customer picks door design, size, and finish | Phase 3 — not built yet |
| Quote Calculator | Instant pricing based on configurator selections | Phase 3 — not built yet |

**Critical rule:** These are ALWAYS embedded as **Shopify App Embed Blocks** — never as raw HTML iframes. Raw iframes break due to Shopify's Content Security Policy.

To reposition an embed once installed:
Shopify Admin → Online Store → Customize → App embeds (left sidebar)

---

## Rules for Claude

1. **Never use raw iframes** — always use App Embed Blocks for embedded apps
2. **Never guess at design decisions** — ask the user before making visual choices
3. **Never create new files** when editing an existing one will accomplish the task
4. **Always explain commands** before running them — the user is a beginner
5. **Always keep the design modern and minimal** — when in doubt, remove, don't add
6. **No shortcuts, no bandaids** — do it properly or flag the issue and ask
7. **Reference phillanton.com** for product imagery and design inspiration
8. **Ask before any destructive action** — deleting files, resetting themes, force pushing

---

## Reference Links

| Resource | URL |
|----------|-----|
| Licensed door designs | https://www.phillanton.com/pages/mdf-doors |
| Shopify Liquid reference | https://shopify.dev/docs/api/liquid |
| Shopify theme CLI guide | https://shopify.dev/docs/storefronts/themes/tools/cli |
| Shopify GitHub integration | https://shopify.dev/docs/storefronts/themes/tools/github |
| GitHub repo | https://github.com/dhodgeman90-cell/Website-Sandbox- |
| Dawn theme docs | https://github.com/Shopify/dawn |
