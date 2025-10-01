# Script PowerShell: fix-react-payload.ps1

Write-Host "==> Deteniendo cualquier proceso Node/NPM si existe..."
Stop-Process -Name node -ErrorAction SilentlyContinue

Write-Host "==> Limpiando node_modules y lockfile..."
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "pnpm-lock.yaml" -ErrorAction SilentlyContinue

Write-Host "==> Instalando React 18 y React-DOM 18..."
pnpm add react@18.3.1 react-dom@18.3.1

Write-Host "==> Instalando @payloadcms/plugin-cloud-storage compatible con React 18..."
pnpm add @payloadcms/plugin-cloud-storage@3.37.0

Write-Host "==> Instalando dependencias restantes (sin frozen-lockfile)..."
pnpm install --no-frozen-lockfile

Write-Host "==> Verificando versiones instaladas..."
pnpm list react
pnpm list react-dom
pnpm list @payloadcms/plugin-cloud-storage

Write-Host "==> Script completado. Proyecto listo para deploy."
