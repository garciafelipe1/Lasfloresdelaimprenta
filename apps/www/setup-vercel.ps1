# 🚀 setup-vercel.ps1
# Script para preparar proyecto Next.js + Payload para deploy en Vercel con pnpm
# Limpia dependencias, cache, fija versiones y configura Vercel

Write-Host "🧹 Limpiando dependencias existentes..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml 2>$null

Write-Host "🧹 Limpiando cache de pnpm..." -ForegroundColor Cyan
pnpm store prune

Write-Host "🧹 Limpiando cache de Vercel..." -ForegroundColor Cyan
if (Test-Path ".vercel") { Remove-Item -Recurse -Force .vercel }

Write-Host "⚙ Configurando Node 18 y pnpm 10.6.x..." -ForegroundColor Cyan

# Verifica Node y Corepack
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node no está instalado, instalalo antes de continuar." -ForegroundColor Red
    exit 1
}

# Asegurar que Corepack está activo
Write-Host "🔧 Activando Corepack para manejar pnpm..." -ForegroundColor Yellow
corepack enable

# Fija pnpm 10.6.x para este proyecto
Write-Host "🔧 Fijando pnpm 10.6.x..." -ForegroundColor Yellow
corepack prepare pnpm@10.6.5 --activate

Write-Host "📦 Instalando dependencias con pnpm..." -ForegroundColor Cyan

# Fijamos versiones compatibles
$dependencies = @(
    "react@18.3.1",
    "react-dom@18.3.1",
    "payload@3.37.0",
    "@payloadcms/plugin-cloud-storage@3.37.0",
    "@payloadcms/db-sqlite@3.37.0"
)

foreach ($dep in $dependencies) {
    Write-Host "🔧 Instalando $dep ..." -ForegroundColor Yellow
    pnpm add $dep --save
}

Write-Host "⚙ Configurando pnpm para ignorar strict peer deps..." -ForegroundColor Cyan
# Crea .npmrc
@"
strict-peer-dependencies=false
"@ | Out-File -Encoding UTF8 .npmrc

Write-Host "⚙ Configurando Vercel para usar pnpm..." -ForegroundColor Cyan
# Crea vercel.json
@"
{
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build",
  "framework": "nextjs"
}
"@ | Out-File -Encoding UTF8 vercel.json

Write-Host "✅ Dependencias y configuración listas para deploy en Vercel" -ForegroundColor Green
Write-Host "📌 Asegurate de subir node_modules/ y pnpm-lock.yaml" -ForegroundColor Green
Write-Host "📌 Luego corre: vercel --prod" -ForegroundColor Green
