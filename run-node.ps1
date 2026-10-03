$ErrorActionPreference = "Stop"
$nodeDir = "d:\fyp proj module\.node"
if (-not (Test-Path "$nodeDir\node-v20.11.1-win-x64\node.exe")) {
    Write-Host "Downloading Node.js..."
    New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip" -OutFile "$nodeDir\node.zip"
    Write-Host "Extracting Node.js..."
    Expand-Archive -Path "$nodeDir\node.zip" -DestinationPath $nodeDir -Force
    Write-Host "Node.js extracted."
}

$env:PATH = "$nodeDir\node-v20.11.1-win-x64;" + $env:PATH
Write-Host "Node version: $(node -v)"
Write-Host "NPM version: $(npm -v)"

Write-Host "Installing dependencies..."
npm install

Write-Host "Starting dev server..."
npm run dev
