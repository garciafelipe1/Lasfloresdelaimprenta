# Script: fix-react18-payload.ps1
# Ejecutar desde la raíz del proyecto

Write-Host "=== 🚀 Fix React 18 + Payload CMS ==="

# 1. Asegurarse de que React 18 esté instalado
Write-Host "🔹 Instalando React 18 y React-DOM 18..."
pnpm add react@^18.2.0 react-dom@^18.2.0

# 2. Instalar versión compatible de Payload CMS
# Cambiar 3.37.0 si necesitas otra compatible con React 18
Write-Host "🔹 Instalando Payload CMS compatible con React 18..."
pnpm add @payloadcms/plugin-cloud-storage@3.37.0

# 3. Actualizar lockfile
Write-Host "🔹 Actualizando lockfile..."
pnpm install --no-frozen-lockfile

# 4. Verificar versiones
Write-Host "🔹 Verificando versiones de React y Payload CMS..."
pnpm list react
pnpm list react-dom
pnpm list @payloadcms/plugin-cloud-storage

Write-Host "✅ Todo listo para commit y deploy!"
Write-Host "Recuerda: git add package.json pnpm-lock.yaml && git commit -m 'Fix React 18 + Payload CMS' && git push"
