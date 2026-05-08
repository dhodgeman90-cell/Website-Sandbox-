# scaffold-brand-kit.ps1
# Creates the standard client brand kit folder structure.
# Usage: .\scripts\scaffold-brand-kit.ps1 -ClientName "AcmeCabinets"

param(
    [Parameter(Mandatory=$true)]
    [ValidatePattern('^[A-Za-z0-9_\- ]+$')]
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
