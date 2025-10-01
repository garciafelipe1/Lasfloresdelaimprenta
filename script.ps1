param(
    [string]$targetVersion = "3.37.0"
)

Write-Host "🔍 Buscando todos los package.json (excepto node_modules)..."
$packageFiles = Get-ChildItem -Recurse -Filter "package.json" | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $packageFiles) {
    Write-Host "⚙️ Revisando:" $file.FullName

    $content = Get-Content $file.PSPath -Raw | ConvertFrom-Json

    # Revisar dependencias normales
    foreach ($dep in $content.dependencies.PSObject.Properties.Name) {
        if ($dep -eq "payload" -or $dep -like "@payloadcms/*") {
            Write-Host "   → Actualizando dependencia:" $dep "a versión $targetVersion"
            $content.dependencies.$dep = $targetVersion
        }
    }

    # Revisar devDependencies
    foreach ($dep in $content.devDependencies.PSObject.Properties.Name) {
        if ($dep -eq "payload" -or $dep -like "@payloadcms/*") {
            Write-Host "   → Actualizando devDependency:" $dep "a versión $targetVersion"
            $content.devDependencies.$dep = $targetVersion
        }
    }

    # Guardar cambios
    $content | ConvertTo-Json -Depth 100 | Set-Content $file.PSPath -Encoding UTF8
    Write-Host "✅ Actualizado:" $file.FullName
}

Write-Host "🗑 Eliminando node_modules y lockfiles..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
if (Test-Path "pnpm-lock.yaml") { Remove-Item -Force "pnpm-lock.yaml" }

Write-Host "📦 Instalando dependencias con pnpm..."
pnpm install --no-frozen-lockfile

Write-Host "🎉 Todas las dependencias de Payload fueron alineadas a la versión $targetVersion"
