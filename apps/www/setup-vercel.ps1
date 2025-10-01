# 🚀 setup-vercel.ps1
# Script para preparar proyecto Next.js + Payload para deploy en Vercel con pnpm
# Limpia dependencias, fija versiones y configura Vercel

Write-Host "🧹 Limpiando dependencias existentes..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml 2>$null

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
