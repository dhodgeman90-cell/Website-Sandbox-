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

$expectedReadmes = @(
    "00_Brand_Guidelines\README.md",
    "01_Logos\README.md",
    "02_Colour_Palette\README.md",
    "03_Favicon\README.md",
    "04_Social_Media\README.md",
    "05_Extras\README.md"
)

foreach ($readme in $expectedReadmes) {
    $path = Join-Path $testRoot $readme
    if (Test-Path $path) {
        Write-Host "  PASS  $readme" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL  $readme — NOT FOUND" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
# Clean up regardless of result
Remove-Item $testRoot -Recurse -Force
Write-Host "Test folder cleaned up." -ForegroundColor Gray

if ($failed -eq 0) {
    Write-Host "All $passed checks passed. Scaffold script working correctly." -ForegroundColor Green
} else {
    Write-Host "$passed passed, $failed failed." -ForegroundColor Red
    exit 1
}
