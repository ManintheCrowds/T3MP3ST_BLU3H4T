# PURPOSE: Generate Tier B blocklet banner candidates (shadow + solid) for profile review.
# DEPENDENCIES: blocklet CLI (cargo install blocklet) OR Node port generate-tier-b-blocklet.mjs
# MODIFICATION NOTES: 2026-07-08 — plan Step 7 harness wrapper

param(
    [string[]]$Words = @("ANDRE SCHU"),
    [int]$Width = 72,
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodePort = Join-Path $ScriptDir "generate-tier-b-blocklet.mjs"
$Validate = Join-Path $ScriptDir "validate-banner.mjs"

if (-not $OutDir) {
    $OutDir = Join-Path (Resolve-Path (Join-Path $ScriptDir "..\..\..\..\ManintheCrowds\assets\banners")).Path
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Format-ProcessArguments {
    param([string[]]$ArgumentList)
    ($ArgumentList | ForEach-Object {
        if ($_ -match '[\s"]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ }
    }) -join ' '
}

function Invoke-ExternalToFile {
    param([string]$Exe, [string[]]$ExeArgs, [string]$OutFile)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Exe
    $psi.Arguments = Format-ProcessArguments $ExeArgs
    $psi.RedirectStandardOutput = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $p = [System.Diagnostics.Process]::Start($psi)
    $stdout = $p.StandardOutput.ReadToEnd()
    $p.WaitForExit()
    if ($p.ExitCode -ne 0) { throw "$Exe exited $($p.ExitCode)" }
    Write-Utf8NoBom -Path $OutFile -Content $stdout
}

function Invoke-BlockletRender {
    param([string]$Font, [string]$OutFile)
    if (Get-Command blocklet -ErrorAction SilentlyContinue) {
        Write-Host "Using native blocklet ($Font) -> $OutFile"
        $blockletArgs = $Words + @("-f", $Font, "--width", "$Width")
        Invoke-ExternalToFile -Exe "blocklet" -ExeArgs $blockletArgs -OutFile $OutFile
        return "blocklet $Font"
    }
    Write-Host "blocklet not found; using Node port ($Font) -> $OutFile"
    $fontArg = if ($Font -eq "standard_solid") { "standard_solid" } else { "standard_shadow" }
    $nodeArgs = @($NodePort) + $Words + @("-f", $fontArg, "--width", "$Width")
    Invoke-ExternalToFile -Exe "node" -ExeArgs $nodeArgs -OutFile $OutFile
    return "generate-tier-b-blocklet.mjs $fontArg"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$shadowFile = Join-Path $OutDir "_candidate-shadow.txt"
$solidFile = Join-Path $OutDir "_candidate-solid.txt"
$candidatesFile = Join-Path $OutDir "andre-schu-tier-b-candidates.txt"

$shadowGen = Invoke-BlockletRender -Font "standard_shadow" -OutFile $shadowFile
$solidGen = Invoke-BlockletRender -Font "standard_solid" -OutFile $solidFile

$shadowBody = Get-Content -Raw $shadowFile
$solidBody = Get-Content -Raw $solidFile
$header = @"
# Tier B candidates — blocklet
# Generated: $(Get-Date -Format "yyyy-MM-dd")
# Generators: $shadowGen; $solidGen

=== candidate: standard_shadow width $Width ===
$($shadowBody.TrimEnd())

=== candidate: standard_solid width $Width ===
$($solidBody.TrimEnd())

"@

Write-Utf8NoBom -Path $candidatesFile -Content $header
Write-Host "Wrote $candidatesFile"

foreach ($f in @($shadowFile, $solidFile)) {
    Write-Host "Validating $f ..."
    & node $Validate $f --max-width $Width --expected ($Words -join " ")
}

Write-Host "Done. Review candidates; delete _candidate-*.txt after promoting winner."
