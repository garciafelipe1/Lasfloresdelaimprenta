# Script para forzar React 18 y bajar payload a 3.37.0

Write-Host "🔧 Corrigiendo dependencias..."

# 1. Leer package.json
$packagePath = "package.json"
if (-Not (Test-Path $packagePath)) {
    Write-Host "❌ No se encontró package.json en este directorio"
    exit 1
}

# 2. Reemplazar versión del plugin
(Get-Content $packagePath) -replace '"@payloadcms/plugin-cloud-storage":\s*".*"', '"@payloadcms/plugin-cloud-storage": "3.37.0"' | Set-Content $packagePath

Write-Host "✅ Versión de @payloadcms/plugin-cloud-storage fijada en 3.37.0"

# 3. Eliminar node_modules y lockfile
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "🗑️ Eliminado node_modules"
}
if (Test-Path "pnpm-lock.yaml") {
    Remove-Item -Force "pnpm-lock.yaml"
    Write-Host "🗑️ Eliminado pnpm-lock.yaml"
}

# 4. Instalar dependencias
Write-Host "📦 Instalando dependencias con pnpm..."
pnpm install --no-frozen-lockfile

# 5. Mostrar versiones instaladas
Write-Host "`n🔍 Verificando versiones:"
pnpm list react react-dom @payloadcms/plugin-cloud-storage
