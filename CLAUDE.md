# The Apex Archive — Claude Code Guide

## Project Overview

**Client:** The Apex Archive buyer
**Site:** The Apex Archive — ecommerce store selling trading card storage cabinets
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
| Todoist | Task inbox — read by Claude at session start via MCP |

**GitHub repo:** https://github.com/dhodgeman90-cell/Website-Sandbox-
**Shopify store URL:** ywbx1x-1n.myshopify.com

---

## Design System

- **Style:** Modern minimal
- **Colors:** Dark Premium palette — confirmed session 1
  - Background: `#1e1410` (near-black)
  - Cards/secondary: `#2c1e12`
  - Heading text: `#f0ede8` (warm cream)
  - Body text: `#b5a898`
  - Accent/gold: `#c9a96e`
  - Borders: `#3d2a18`
  - Parchment strip: `#e8dfc8`
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
├── inbox.md                         ← retired (replaced by Todoist "VS Code" project)
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
3. Type: git pull                         (grab any tasks added from your phone)
4. Type: code .           (VS Code opens in the right folder)
5. In the VS Code terminal: shopify theme dev --store ywbx1x-1n.myshopify.com
6. Browser opens at http://localhost:9292 — this is your live preview
7. Launch Claude Code and start working
```

**At the start of every session, read open tasks from the Todoist "VS Code" project (ID: 6gmJg3J4gfj7fvwP) before doing anything else.**
Use the Todoist MCP tools to fetch tasks grouped by section, summarize what's waiting, and ask which project to start with or suggest a logical work order based on urgency and dependencies.
Sections in this project: Apex Archive | CEM Configurator | T-Shirt Business | Time Tracker | Admin / General
When tasks are completed during the session, mark them done in Todoist using the MCP tools — do not just acknowledge them verbally.
To expand to additional Todoist projects in future, update this instruction to list the extra project names.

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

## Working Style

These apply to every session and every prompt, across every project:

1. **Enterprise-level by default** — approach each task the way a top-tier professional team would. Tell me how the "big dogs" do it: the proper, scalable, industry-standard approach, not a quick hack.
2. **Search the internet for recent context** — when a task depends on current information (pricing, library/tool versions, best practices, "how are people doing X now," recent news), look up very recent news and real examples before answering instead of relying on memory. Skip the search for purely internal code tasks (renames, local refactors) where there's nothing online to find — but if I miss one you wanted, say "search it" and I will.
3. **No shortcuts, no Band-Aids, no guessing** — especially when debugging or fixing. Find the real root cause and fix it properly, or flag the issue and ask. Never patch over a problem.
4. **Don't reflexively agree** — only agree when I'm genuinely certain. If I'm not sure, say so, push back, and verify rather than just validating what you said.

---

## Rules for Claude

1. **Never use raw iframes** — always use App Embed Blocks for embedded apps
2. **Never guess at design decisions** — ask the user before making visual choices
3. **Never create new files** when editing an existing one will accomplish the task
4. **Always explain commands** before running them — the user is a beginner
5. **Always keep the design modern and minimal** — when in doubt, remove, don't add
6. **No shortcuts, no bandaids** — do it properly or flag the issue and ask
7. **Ask before any destructive action** — deleting files, resetting themes, force pushing

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
