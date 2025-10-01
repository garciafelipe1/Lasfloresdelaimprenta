# upgrade-react18-payload.ps1
# Script para mantener React 18 y usar Payload compatible

Write-Host "=== START: Ajuste Payload para React 18 ==="

# 1. Borrar node_modules y lockfile
Write-Host "Eliminando node_modules y pnpm-lock.yaml..."
Remove-Item -Recurse -Force "node_modules"
Remove-Item -Force "pnpm-lock.yaml"

# 2. Forzar versión de Payload CMS compatible con React 18
Write-Host "Instalando @payloadcms/plugin-cloud-storage@3.37.0..."
pnpm add @payloadcms/plugin-cloud-storage@3.37.0

# 3. Reinstalar dependencias con pnpm sin frozen lockfile
Write-Host "Instalando todas las dependencias..."
pnpm install --no-frozen-lockfile

# 4. Limpiar cache de pnpm (opcional pero recomendable)
Write-Host "Limpiando cache de pnpm..."
pnpm store prune

# 5. Confirmar versiones instaladas
Write-Host "Verificando versiones instaladas de React y Payload..."
pnpm list react
pnpm list react-dom
pnpm list @payloadcms/plugin-cloud-storage

Write-Host "=== FIN: Proyecto listo para deploy con React 18 y Payload compatible ==="
