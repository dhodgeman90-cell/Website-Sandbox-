---
title: Oxford Wood Works — Design Spec
date: 2026-05-05
status: approved
session: brainstorming
---

# Oxford Wood Works — Design Spec

## What We're Building

An ecommerce website for **Oxford Wood Works**, a CNC woodworking business selling MDF doors. Built for client **Phill Anton**, who has licensed door designs through his own company (phillanton.com) and has given explicit permission to reference that site's imagery and adapt it to Oxford Wood Works branding.

This is a **Phase 1 preliminary project** — the goal is to establish the foundation (environment, CLAUDE.md, Shopify setup) before moving to visual design and custom app development.

---

## Decisions Made

### Product
- Physical product: CNC-cut MDF doors
- Designs licensed from: https://www.phillanton.com/pages/mdf-doors
- Made to order on a CNC machine
- Product imagery: sourced from phillanton.com, styled to match Oxford Wood Works aesthetic

### Platform
- **Shopify Online Store 2.0** with the Dawn theme as base
- Reason: officially recommended by Shopify for small physical product stores in 2025; free, fast, beginner-friendly, supports all required features natively
- Rejected: Hydrogen (headless) — too complex for this use case; custom theme from scratch — unnecessary complexity

### Version Control
- GitHub repo: `dhodgeman90-cell/Website-Sandbox-`
- Strategy: `main` branch = live theme, `develop` branch = unpublished dev theme
- GitHub ↔ Shopify auto-sync via official Shopify GitHub integration

### Embedded Apps
- **Door Configurator** — customer picks design, size, finish
- **Quote Calculator** — instant pricing based on selections
- Integration method: **Shopify App Embed Blocks** (not raw iframes)
- Reason: Shopify's Content Security Policy blocks raw iframes; App Embed Blocks are the official, supported solution
- Build timeline: Phase 3 (future session)

### Visual Direction
- **Style:** Modern and minimal
- **Feel:** Clean lines, white space, premium — comparable to a high-end home goods brand
- **Colors:** TBD — to be chosen with user via visual companion in session 2
- **Typography:** Clean geometric sans-serif (Inter, DM Sans, or equivalent)
- **No:** gradients, drop shadows, decorative borders, crowded layouts

### Development Workflow
- Editor: VS Code + Shopify Liquid extension + Prettier
- Local preview: Shopify CLI (`shopify theme dev`)
- AI assistant: Claude Code reads CLAUDE.md each session for full context
- Owner skill level: beginner — all instructions must be explicit and step-by-step

---

## Project Phases

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Environment setup + CLAUDE.md | In progress |
| 2 | Visual design — colors, fonts, homepage layout | Pending |
| 3 | Product pages — door images, descriptions | Pending |
| 4 | App Embed Blocks — configurator + calculator | Pending |
| 5 | Launch — connect domain, go live | Pending |

---

## Open Questions

- [ ] Exact Shopify store URL (.myshopify.com address)
- [ ] Brand color palette (to be chosen in session 2)
- [ ] Number of door designs to list initially
- [ ] Pricing model for the quote calculator (flat rate, per sq ft, custom formula?)
- [ ] Where the configurator and calculator apps will be hosted

---

## Session Notes

- User is building this for Phill Anton as a preliminary/demo project
- Phill Anton has explicitly authorized use of phillanton.com imagery and design references
- User is a beginner with VS Code, GitHub, and Shopify CLI — CLAUDE.md must be written accordingly
- Node.js is not yet installed on the machine — this is the first prerequisite for Phase 1
