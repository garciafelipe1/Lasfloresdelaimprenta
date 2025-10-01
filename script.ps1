Write-Host "🔍 Corrigiendo versiones de Payload y plugin-cloud-storage a 3.37.0..."

# Buscar todos los package.json (excepto node_modules)
$packageFiles = Get-ChildItem -Recurse -Filter "package.json" | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $packageFiles) {
    (Get-Content $file.PSPath) |
        ForEach-Object {
            $_ -replace '"@payloadcms/plugin-cloud-storage":\s*"[^\"]+"', '"@payloadcms/plugin-cloud-storage": "3.37.0"' `
               -replace '"payload":\s*"[^\"]+"', '"payload": "3.37.0"'
        } |
        Set-Content $file.PSPath -Encoding UTF8
    Write-Host "✅ Actualizado:" $file.FullName
}

Write-Host "🗑 Eliminando node_modules y lockfiles..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
if (Test-Path "pnpm-lock.yaml") { Remove-Item -Force "pnpm-lock.yaml" }

Write-Host "📦 Instalando dependencias con pnpm..."
pnpm install --no-frozen-lockfile

Write-Host "🎉 Listo. Ahora Payload y su plugin están sincronizados en la versión 3.37.0."
