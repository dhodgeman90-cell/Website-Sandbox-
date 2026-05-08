# Brand Kit Tier System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the brand kit tier system into the cabinet shop services proposal, create reusable client templates, and build a PowerShell scaffold script that generates the standard `ClientName_BrandKit/` folder structure for every client delivery.

**Architecture:** Four documentation artifacts (updated proposal, brand brief intake form, per-tier delivery checklists) plus one PowerShell utility script. No Shopify theme code is touched. All files live in `docs/` and `scripts/`. The scaffold script is the only executable — everything else is Markdown.

**Tech Stack:** Markdown, PowerShell 7+, Git

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `docs/cabinet-shop-services-proposal.md` | Add brand kit deliverables to each tier; update Not Included, Timeline, and Pricing Summary sections |
| Create | `docs/templates/brand-brief-template.md` | Intake form to fill out at kickoff — captures everything needed to design a client's brand |
| Create | `docs/templates/brand-kit-checklist-tier3.md` | Delivery checklist for Tier 3 brand essentials |
| Create | `docs/templates/brand-kit-checklist-tier4.md` | Delivery checklist for Tier 4 extended brand kit |
| Create | `docs/templates/brand-kit-checklist-tier5.md` | Delivery checklist for Tier 5 brand identity system |
| Create | `scripts/scaffold-brand-kit.ps1` | PowerShell script — creates the standard client folder structure |
| Create | `scripts/test-scaffold-brand-kit.ps1` | Verification script — confirms scaffold created all expected folders |

---

## Task 1: Update the services proposal — Tier 1 and Tier 2

**Files:**
- Modify: `docs/cabinet-shop-services-proposal.md` (lines 39–71)

- [ ] **Step 1: Add favicon note to Tier 1's "Included" section**

Find this line in `docs/cabinet-shop-services-proposal.md`:
```
- One round of revisions included
```

Replace it with:
```
- One round of revisions included
- Custom favicon created and installed (client supplies logo)
```

- [ ] **Step 2: Update Tier 1's "Client provides" line**

Find:
```
**Client provides:** Logo file, brand colors (or direction), written copy, product photos
```

Replace with:
```
**Client provides:** Logo file, brand colors (or direction), written copy, product photos
**Brand assets:** Favicon included. All other brand assets (logo suite, colour palette, social templates) supplied by client.
```

- [ ] **Step 3: Add brand note to Tier 2's "Added features" section**

Find:
```
- Client receives structured, actionable data from every enquiry
```

Replace with:
```
- Client receives structured, actionable data from every enquiry
- Custom favicon created and installed; client's existing logo and colour scheme applied to the site
**Brand assets:** Favicon included. All other brand assets supplied by client.
```

- [ ] **Step 4: Verify changes look correct**

Open `docs/cabinet-shop-services-proposal.md` and confirm Tier 1 and Tier 2 both have a clear brand assets note. No OWW references should appear.

- [ ] **Step 5: Commit**

```powershell
git add docs/cabinet-shop-services-proposal.md
git commit -m "docs: add brand kit notes to Tier 1 and Tier 2 in services proposal"
```

---

## Task 2: Update the services proposal — Tiers 3, 4, and 5

**Files:**
- Modify: `docs/cabinet-shop-services-proposal.md` (lines 76–115)

- [ ] **Step 1: Add brand kit section to Tier 3**

Find:
```
- Built entirely in vanilla JavaScript — no apps, no backend, no external services
```

Replace with:
```
- Built entirely in vanilla JavaScript — no apps, no backend, no external services

**Brand Kit — Essentials (included from Tier 3):**
- Primary logo (horizontal / long form), condensed logo (vertical / short form), icon mark
- Custom favicon (.ico + .png)
- Hex colour palette (6 brand colours)
- 5 × social media post templates (1080×1080 + 1200×630)
- All assets delivered in SVG + PNG format
- Assets implemented directly on the site; no technical handoff required from client
```

- [ ] **Step 2: Add brand kit section to Tier 4**

Find:
```
**Note:** Requires the client to be on Shopify's Basic plan or above. Most shops are already on a qualifying plan.
```

Replace with:
```
**Note:** Requires the client to be on Shopify's Basic plan or above. Most shops are already on a qualifying plan.

**Brand Kit — Extended (included from Tier 4):**
- Everything in Tier 3 Brand Kit
- 15 × social media post templates
- Social profile image set (sized for Facebook, Instagram, LinkedIn, YouTube)
- Email signature template (HTML, ready to install in any email client)
- Branded thumbnail pack (YouTube and web, 1280×720)
- White and black logo variants
- All assets in SVG + PNG + PDF format
```

- [ ] **Step 3: Add brand kit section to Tier 5**

Find:
```
- Bulk order support — order notes and quantity-based pricing adjustments
```

Replace with:
```
- Bulk order support — order notes and quantity-based pricing adjustments

**Brand Identity System (included at Tier 5):**
- Everything in Tier 4 Brand Kit
- Brand guidelines PDF (print-ready; covers logo usage, colour palette, typography, do's and don'ts)
- CSS design system documentation (colour variables, button styles, typography scale)
- Typography hierarchy defined (heading levels, body text, labels)
- Button and UI component style guide
- Ongoing brand asset management (updates and additions at the retainer rate)
- ZIP archive of all brand assets for clients with in-house IT teams
```

- [ ] **Step 4: Update the "What Is Not Included" table**

Find:
```
| Photography and copywriting | Client supplies all assets |
```

Replace with:
```
| Photography and copywriting | Client supplies all photos and written copy for the site |
| Brand asset creation (Tiers 1–2) | Client supplies logo, colours, and brand assets for Tiers 1 and 2 only — brand kit is included from Tier 3 |
```

- [ ] **Step 5: Update Timeline table to account for brand kit work**

Find:
```
| Tier 3 — Live Estimator | 3–4 weeks |
| Tier 4 — Full E-Commerce | 4–6 weeks |
| Tier 5 — Trade & Pro Portal | 6–8 weeks |
```

Replace with:
```
| Tier 3 — Live Estimator | 4–5 weeks (includes brand kit) |
| Tier 4 — Full E-Commerce | 5–7 weeks (includes extended brand kit) |
| Tier 5 — Trade & Pro Portal | 7–9 weeks (includes brand identity system) |
```

- [ ] **Step 6: Verify the full proposal reads cleanly top to bottom**

Open `docs/cabinet-shop-services-proposal.md` and read from the "Service Tiers" heading to the end. Confirm every tier has a clear brand section, the "Not Included" table is consistent, and the timeline adds up.

- [ ] **Step 7: Commit**

```powershell
git add docs/cabinet-shop-services-proposal.md
git commit -m "docs: add brand kit deliverables to Tiers 3-5 in services proposal"
```

---

## Task 3: Create the brand brief intake template

**Files:**
- Create: `docs/templates/brand-brief-template.md`

- [ ] **Step 1: Create the templates directory**

```powershell
New-Item -ItemType Directory -Path "docs\templates" -Force
```

Expected: Directory created at `c:\VS Code\Website Fuckery\docs\templates\`

- [ ] **Step 2: Write the brand brief template**

Create `docs/templates/brand-brief-template.md` with this content:

```markdown
# Brand Brief — [Client Name]

**Date:** YYYY-MM-DD
**Tier:** [ ] 3 — Brand Essentials  [ ] 4 — Extended Kit  [ ] 5 — Identity System
**Filled out by:** [Your name]

---

## 1. Business Basics

- **Business name (full):**
- **Business name (short / abbreviated, if any):**
- **Tagline or slogan (if any):**
- **Industry / niche:**
- **Location:**
- **Website URL (if existing):**

---

## 2. Audience

- **Who is your primary customer?** (e.g. homeowners, builders, designers, contractors)
- **What do you want them to feel when they see your brand?**
- **What do you want them to do?** (call, email, buy, request a quote)

---

## 3. Visual Direction

- **3 words that describe your brand personality:** (e.g. bold, trustworthy, premium)
- **3 words you want to avoid:** (e.g. cheap, corporate, busy)
- **Brands or logos you admire** (any industry — paste URLs or describe):
- **Colours you like:**
- **Colours to avoid:**
- **Any existing brand assets we must keep?** (e.g. a logo the owner is attached to)

---

## 4. Logo Preferences

- **Preferred logo style:**
  - [ ] Text-only wordmark (just the business name in a stylised font)
  - [ ] Icon + text (symbol alongside the name)
  - [ ] Icon only (standalone symbol/monogram)
  - [ ] No preference
- **Any symbols or imagery that feel relevant to your business?**
- **Any symbols or imagery to avoid?**

---

## 5. Colour Palette

- **Overall feeling:**
  - [ ] Dark and premium
  - [ ] Light and clean
  - [ ] Bold and energetic
  - [ ] Natural and earthy
  - [ ] No preference
- **Any specific colours already in use?** (hex codes if known):

---

## 6. Typography

- **Font personality preference:**
  - [ ] Modern geometric (clean, minimal — like Inter or DM Sans)
  - [ ] Classic serif (traditional, trustworthy — like Merriweather)
  - [ ] Industrial / condensed (bold, utilitarian)
  - [ ] No preference
- **Any fonts already in use on existing materials?**

---

## 7. Social Media (Tier 4+)

- **Which platforms are you active on?** (check all that apply)
  - [ ] Facebook
  - [ ] Instagram
  - [ ] LinkedIn
  - [ ] YouTube
  - [ ] Other: ___________
- **What kind of content do you post?** (jobs, tips, before/after, promotions, etc.)
- **Do you have a profile photo / headshot to use for profile images?**

---

## 8. Final Notes

- **Anything else we should know before designing?**
- **Hard deadline (if any):**
- **Revision rounds agreed:** [ ] 1  [ ] 2  [ ] Custom: ___
```

- [ ] **Step 3: Verify the file was created**

```powershell
Test-Path "docs\templates\brand-brief-template.md"
```

Expected output: `True`

- [ ] **Step 4: Commit**

```powershell
git add docs/templates/brand-brief-template.md
git commit -m "docs: add brand brief intake template"
```

---

## Task 4: Create the per-tier delivery checklists

**Files:**
- Create: `docs/templates/brand-kit-checklist-tier3.md`
- Create: `docs/templates/brand-kit-checklist-tier4.md`
- Create: `docs/templates/brand-kit-checklist-tier5.md`

- [ ] **Step 1: Write the Tier 3 checklist**

Create `docs/templates/brand-kit-checklist-tier3.md`:

```markdown
# Brand Kit Delivery Checklist — Tier 3 (Brand Essentials)

**Client:** [Client Name]
**Delivered by:** [Your name]
**Date:**

---

## Logos — 01_Logos/

### Primary (horizontal / long form)
- [ ] Full colour — SVG
- [ ] Full colour — PNG (transparent background, min 1000px wide)
- [ ] White version — SVG
- [ ] White version — PNG
- [ ] Black version — SVG
- [ ] Black version — PNG

### Condensed (vertical / short form)
- [ ] Full colour — SVG
- [ ] Full colour — PNG (transparent background, min 800px)
- [ ] White version — SVG
- [ ] White version — PNG
- [ ] Black version — SVG
- [ ] Black version — PNG

### Icon Mark (standalone symbol)
- [ ] Full colour — SVG
- [ ] Full colour — PNG (transparent background, min 500×500px)
- [ ] White version — SVG
- [ ] White version — PNG
- [ ] Black version — SVG
- [ ] Black version — PNG

---

## Colour Palette — 02_Colour_Palette/

- [ ] PDF swatch sheet created (ClientName_Colours.pdf)
  - Contains: colour name, hex code, RGB values, CMYK values
  - Minimum 6 brand colours documented

---

## Favicon — 03_Favicon/

- [ ] favicon.ico (multi-size: 16×16, 32×32, 48×48)
- [ ] favicon-32x32.png
- [ ] favicon-180x180.png (Apple touch icon)
- [ ] Installed on Shopify site and tested in browser tab

---

## Social Media Templates — 04_Social_Media/Post_Templates/

- [ ] Template 1 — square (1080×1080px) — PNG export
- [ ] Template 2 — square (1080×1080px) — PNG export
- [ ] Template 3 — square (1080×1080px) — PNG export
- [ ] Template 4 — landscape (1200×630px) — PNG export
- [ ] Template 5 — landscape (1200×630px) — PNG export
- [ ] Source files saved (Canva link or .psd/.ai file)

---

## Final Checks

- [ ] All folder names match the standard structure (ClientName_BrandKit/)
- [ ] All files follow naming convention: ClientName_AssetType_Variant.ext
- [ ] Folder zipped and shared with client (if IT handoff requested)
- [ ] Assets implemented on Shopify site
- [ ] Client sign-off received
```

- [ ] **Step 2: Write the Tier 4 checklist**

Create `docs/templates/brand-kit-checklist-tier4.md`:

```markdown
# Brand Kit Delivery Checklist — Tier 4 (Extended Brand Kit)

**Client:** [Client Name]
**Delivered by:** [Your name]
**Date:**

---

## All Tier 3 items (complete Tier 3 checklist first)

- [ ] Tier 3 checklist completed and signed off

---

## Additional Logo Variants — 01_Logos/

- [ ] White logo variants confirmed (all 3 marks: Primary, Condensed, Icon)
- [ ] Black logo variants confirmed (all 3 marks: Primary, Condensed, Icon)
- [ ] PDF versions of primary logo created (for print use)

---

## Extended Social Media Templates — 04_Social_Media/Post_Templates/

Templates 6–15 (10 additional templates):
- [ ] Templates 6–10 — square (1080×1080px) — PNG exports
- [ ] Templates 11–15 — landscape (1200×630px) — PNG exports
- [ ] Source files saved (Canva link or .psd/.ai file)

---

## Social Profile Images — 04_Social_Media/Profile_Images/

- [ ] Facebook profile (170×170px) — PNG
- [ ] Instagram profile (320×320px) — PNG
- [ ] LinkedIn profile (400×400px) — PNG
- [ ] YouTube channel icon (800×800px) — PNG
- [ ] YouTube channel art (2560×1440px) — PNG

---

## Email Signature — 05_Extras/

- [ ] HTML email signature file created (ClientName_EmailSignature.html)
  - Contains: logo, name, title, phone, website, social links
  - Tested in Gmail or Outlook
- [ ] Plain text fallback version included

---

## Thumbnail Pack — 04_Social_Media/Thumbnails/

- [ ] YouTube thumbnail template (1280×720px) — PNG export
- [ ] Web / blog thumbnail template (1200×628px) — PNG export
- [ ] Source files saved

---

## Final Checks

- [ ] All Tier 3 checks passed
- [ ] All files follow naming convention: ClientName_AssetType_Variant.ext
- [ ] Assets implemented on Shopify site
- [ ] Client sign-off received
```

- [ ] **Step 3: Write the Tier 5 checklist**

Create `docs/templates/brand-kit-checklist-tier5.md`:

```markdown
# Brand Kit Delivery Checklist — Tier 5 (Brand Identity System)

**Client:** [Client Name]
**Delivered by:** [Your name]
**Date:**

---

## All Tier 4 items (complete Tier 4 checklist first)

- [ ] Tier 4 checklist completed and signed off

---

## Brand Guidelines PDF — 00_Brand_Guidelines/

- [ ] ClientName_BrandGuidelines.pdf created
  - [ ] Cover page (client name, logo, date)
  - [ ] Logo usage section (correct use, incorrect use examples, minimum sizes, clear space rules)
  - [ ] Colour palette page (swatches with hex, RGB, CMYK)
  - [ ] Typography section (heading font, body font, sizes, hierarchy)
  - [ ] Do's and don'ts page
  - [ ] Social media usage guidelines
- [ ] PDF is print-ready (CMYK colour mode, 300dpi images)
- [ ] PDF is web-optimised version also created (RGB, compressed)

---

## CSS Design System — 05_Extras/

- [ ] ClientName_CSSDesignSystem.md created
  - [ ] CSS custom property (variable) definitions for all brand colours
  - [ ] Typography scale (h1–h6 sizes, line heights, font weights)
  - [ ] Button component styles (primary, secondary, outline variants)
  - [ ] Form input styles
  - [ ] Spacing scale
- [ ] CSS variables implemented in Shopify theme's settings_data.json or custom CSS file
- [ ] Verified visually in local Shopify preview (shopify theme dev)

---

## ZIP Archive — (IT Handoff)

- [ ] All brand kit folders zipped: ClientName_BrandKit.zip
- [ ] ZIP file tested — opens and all folders/files are intact
- [ ] Delivery method confirmed with client (Google Drive / Dropbox / email)
- [ ] Link or file sent to client IT contact

---

## Ongoing Brand Asset Management

- [ ] Retainer rate and scope confirmed with client ($150/hr)
- [ ] Asset management scope documented (what types of requests are covered)
- [ ] Source files stored in a location accessible for future updates

---

## Final Checks

- [ ] All Tier 4 checks passed
- [ ] Brand guidelines PDF reviewed by client
- [ ] CSS design system live on Shopify site
- [ ] ZIP delivered if IT handoff requested
- [ ] Client sign-off received on full brand identity system
```

- [ ] **Step 4: Commit all three checklists**

```powershell
git add docs/templates/brand-kit-checklist-tier3.md docs/templates/brand-kit-checklist-tier4.md docs/templates/brand-kit-checklist-tier5.md
git commit -m "docs: add per-tier brand kit delivery checklists"
```

---

## Task 5: Create the folder scaffold script

**Files:**
- Create: `scripts/scaffold-brand-kit.ps1`
- Create: `scripts/test-scaffold-brand-kit.ps1`

- [ ] **Step 1: Create the scripts directory**

```powershell
New-Item -ItemType Directory -Path "scripts" -Force
```

Expected: Directory created at `c:\VS Code\Website Fuckery\scripts\`

- [ ] **Step 2: Write the scaffold script**

Create `scripts/scaffold-brand-kit.ps1`:

```powershell
# scaffold-brand-kit.ps1
# Creates the standard client brand kit folder structure.
# Usage: .\scripts\scaffold-brand-kit.ps1 -ClientName "AcmeCabinets"

param(
    [Parameter(Mandatory=$true)]
    [string]$ClientName,

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "."
)

$root = Join-Path $OutputPath "${ClientName}_BrandKit"

$folders = @(
    "00_Brand_Guidelines",
    "01_Logos\Primary",
    "01_Logos\Condensed",
    "01_Logos\Icon_Mark",
    "02_Colour_Palette",
    "03_Favicon",
    "04_Social_Media\Post_Templates",
    "04_Social_Media\Profile_Images",
    "04_Social_Media\Thumbnails",
    "05_Extras"
)

foreach ($folder in $folders) {
    $path = Join-Path $root $folder
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

# Drop a README into each top-level folder
$readmes = @{
    "00_Brand_Guidelines" = "# Brand Guidelines`nPlace the completed brand guidelines PDF here.`nFilename: ${ClientName}_BrandGuidelines.pdf"
    "01_Logos"            = "# Logos`nThree subfolders: Primary (horizontal), Condensed (vertical), Icon_Mark (symbol).`nEach subfolder should contain: full-colour, white, and black versions in SVG, PNG, and PDF."
    "02_Colour_Palette"   = "# Colour Palette`nPlace the colour swatch PDF here.`nFilename: ${ClientName}_Colours.pdf"
    "03_Favicon"          = "# Favicon`nRequired files: favicon.ico, favicon-32x32.png, favicon-180x180.png"
    "04_Social_Media"     = "# Social Media`nThree subfolders: Post_Templates, Profile_Images, Thumbnails."
    "05_Extras"           = "# Extras`nEmail signature HTML, CSS design system doc, and any other brand assets."
}

foreach ($folder in $readmes.Keys) {
    $readmePath = Join-Path $root $folder "README.md"
    Set-Content -Path $readmePath -Value $readmes[$folder] -Encoding UTF8
}

Write-Host ""
Write-Host "Brand kit folder created at: $root" -ForegroundColor Green
Write-Host ""
Write-Host "Folders created:" -ForegroundColor Cyan
Get-ChildItem -Path $root -Recurse -Directory | ForEach-Object {
    Write-Host "  $($_.FullName.Replace($root, '').TrimStart('\'))" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Next step: open docs/templates/brand-kit-checklist-tier3.md and work through it." -ForegroundColor Yellow
```

- [ ] **Step 3: Write the verification test script**

Create `scripts/test-scaffold-brand-kit.ps1`:

```powershell
# test-scaffold-brand-kit.ps1
# Verifies that scaffold-brand-kit.ps1 creates the correct folder structure.
# Usage: .\scripts\test-scaffold-brand-kit.ps1

$testClient = "TEST_CLIENT"
$testOutput = $env:TEMP
$testRoot   = Join-Path $testOutput "${testClient}_BrandKit"

# Clean up any previous test run
if (Test-Path $testRoot) { Remove-Item $testRoot -Recurse -Force }

# Run the scaffold
& "$PSScriptRoot\scaffold-brand-kit.ps1" -ClientName $testClient -OutputPath $testOutput

$expectedFolders = @(
    "00_Brand_Guidelines",
    "01_Logos\Primary",
    "01_Logos\Condensed",
    "01_Logos\Icon_Mark",
    "02_Colour_Palette",
    "03_Favicon",
    "04_Social_Media\Post_Templates",
    "04_Social_Media\Profile_Images",
    "04_Social_Media\Thumbnails",
    "05_Extras"
)

$passed = 0
$failed = 0

foreach ($folder in $expectedFolders) {
    $path = Join-Path $testRoot $folder
    if (Test-Path $path) {
        Write-Host "  PASS  $folder" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL  $folder — NOT FOUND" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
if ($failed -eq 0) {
    Write-Host "All $passed folders present. Scaffold script working correctly." -ForegroundColor Green
} else {
    Write-Host "$passed passed, $failed failed." -ForegroundColor Red
    exit 1
}

# Clean up
Remove-Item $testRoot -Recurse -Force
Write-Host "Test folder cleaned up." -ForegroundColor Gray
```

- [ ] **Step 4: Run the test to verify the scaffold script works**

```powershell
cd "c:\VS Code\Website Fuckery"
.\scripts\test-scaffold-brand-kit.ps1
```

Expected output:
```
  PASS  00_Brand_Guidelines
  PASS  01_Logos\Primary
  PASS  01_Logos\Condensed
  PASS  01_Logos\Icon_Mark
  PASS  02_Colour_Palette
  PASS  03_Favicon
  PASS  04_Social_Media\Post_Templates
  PASS  04_Social_Media\Profile_Images
  PASS  04_Social_Media\Thumbnails
  PASS  05_Extras

All 10 folders present. Scaffold script working correctly.
Test folder cleaned up.
```

If any FAIL lines appear, open `scripts/scaffold-brand-kit.ps1` and check the `$folders` array for typos.

- [ ] **Step 5: Do a live test run to see the full output**

```powershell
.\scripts\scaffold-brand-kit.ps1 -ClientName "OxfordWoodWorks" -OutputPath "$env:TEMP"
```

Expected: A `OxfordWoodWorks_BrandKit` folder appears in your Temp directory with all 10 subfolders and README files. Open Windows Explorer to confirm it looks right. Delete the test folder when done.

- [ ] **Step 6: Commit**

```powershell
git add scripts/scaffold-brand-kit.ps1 scripts/test-scaffold-brand-kit.ps1
git commit -m "feat: add brand kit folder scaffold script with verification test"
```

---

## Task 6: Final commit — all files together

- [ ] **Step 1: Confirm all files are committed**

```powershell
git status
```

Expected: `nothing to commit, working tree clean`

If any files are still untracked or modified, stage and commit them:

```powershell
git add .
git status  # review what's being added before committing
git commit -m "docs: finalise brand kit tier system — proposal, templates, scaffold"
```

- [ ] **Step 2: Push to GitHub**

```powershell
git push origin main
```

Expected: Branch pushed. Shopify will auto-sync via the GitHub integration (theme files only — `docs/` and `scripts/` are ignored by Shopify but tracked in GitHub).

- [ ] **Step 3: Verify on GitHub**

Open https://github.com/dhodgeman90-cell/Website-Sandbox- and confirm:
- `docs/cabinet-shop-services-proposal.md` shows recent changes
- `docs/templates/` folder exists with 4 files (brief template + 3 checklists)
- `scripts/` folder exists with 2 files (scaffold + test)
- `docs/Phill_Anton_Website_Brand_Packages.pdf` is present
