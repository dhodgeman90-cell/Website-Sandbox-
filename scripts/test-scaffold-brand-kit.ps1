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
