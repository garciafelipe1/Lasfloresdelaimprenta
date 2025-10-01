# ---------------------------------------------------------
# Script PowerShell: fix-react18.ps1
# Objetivo: Volver proyecto a React 18 y actualizar Payload
# ---------------------------------------------------------

Write-Host "🚀 Iniciando script para fijar React 18 y Payload compatible..." -ForegroundColor Cyan

# 1️⃣ Movernos al directorio raíz del proyecto (ajustar si es necesario)
$projectDir = "C:\Users\feli2\OneDrive\Escritorio\lasflores\las-flores-de-la-imprenta-main\apps\www"
Set-Location $projectDir
Write-Host "📂 Directorio actual: $PWD"

# 2️⃣ Eliminar node_modules y lockfile
if (Test-Path "node_modules") {
    Write-Host "🗑 Eliminando node_modules..."
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path "pnpm-lock.yaml") {
    Write-Host "🗑 Eliminando pnpm-lock.yaml..."
    Remove-Item -Force pnpm-lock.yaml
}

if (Test-Path "package-lock.json") {
    Write-Host "🗑 Eliminando package-lock.json..."
    Remove-Item -Force package-lock.json
}

# 3️⃣ Fijar React 18 en package.json
Write-Host "🔧 Fijando react y react-dom en 18.2.0..."
pnpm add react@18.2.0 react-dom@18.2.0 --save-exact

# 4️⃣ Actualizar Payload y plugins compatibles con React 18
Write-Host "🔧 Actualizando paquetes Payload a versión compatible con React 18..."
pnpm add @payloadcms/db-sqlite@3.38.0 `
        @payloadcms/next@3.38.0 `
        @payloadcms/plugin-cloud-storage@3.38.0 `
        @payloadcms/richtext-lexical@3.38.0 `
        @payloadcms/storage-s3@3.38.0 `
        @payloadcms/ui@3.38.0 --save-exact

# 5️⃣ Instalar todas las dependencias limpias
Write-Host "📦 Instalando dependencias..."
pnpm install

# 6️⃣ Limpiar cache de Vercel (opcional pero recomendable)
Write-Host "🧹 Limpiando cache de Vercel..."
vercel logout
vercel login

Write-Host "✅ Script completado. Proyecto fijado a React 18 y Payload compatible."
Write-Host "Ahora podés correr 'pnpm dev' o 'vercel deploy' sin conflictos de dependencias." -ForegroundColor Green
