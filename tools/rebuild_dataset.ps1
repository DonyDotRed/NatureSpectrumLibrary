param(
  [Parameter(Mandatory=$true)][string]$ExcelPath,
  [Parameter(Mandatory=$true)][string]$Password
)
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Raw = Join-Path $Root "data.raw.json"
$Out = Join-Path $Root "site/assets/data/library.enc.json"
python (Join-Path $PSScriptRoot "xlsx_to_json.py") $ExcelPath $Raw
$env:NSL_PASSWORD = $Password
node (Join-Path $PSScriptRoot "encrypt_dataset.mjs") $Raw $Out
Remove-Item $Raw -Force
Write-Host "Encrypted dataset rebuilt: $Out"
