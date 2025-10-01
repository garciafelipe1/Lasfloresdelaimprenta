Write-Host "🔍 Corrigiendo versión de @payloadcms/plugin-cloud-storage a 3.37.0 en todos los package.json..."

# Buscar todos los package.json (excepto node_modules)
$packageFiles = Get-ChildItem -Recurse -Filter "package.json" | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $packageFiles) {
    (Get-Content $file.PSPath) |
        ForEach-Object { $_ -replace '"@payloadcms/plugin-cloud-storage":\s*"[^\"]+"', '"@payloadcms/plugin-cloud-storage": "3.37.0"' } |
        Set-Content $file.PSPath -Encoding UTF8
    Write-Host "✅ Actualizado:" $file.FullName
}

Write-Host "🗑 Eliminando node_modules y lockfiles..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
if (Test-Path "pnpm-lock.yaml") { Remove-Item -Force "pnpm-lock.yaml" }

Write-Host "📦 Instalando dependencias con pnpm..."
pnpm install --no-frozen-lockfile

Write-Host "🎉 Listo. Ahora podés hacer commit y volver a deployar en Vercel."
