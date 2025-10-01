# fix-react-payload.ps1
# PowerShell script para Windows: fija React 18 y Payload 3.37, limpia node_modules y reinstala todo

Write-Host "🚀 Iniciando corrección de dependencias para React 18 y Payload 3.37..."

# 1️⃣ Fijar React 18
Write-Host "🔹 Instalando React 18.2.0 y ReactDOM 18.2.0..."
pnpm add react@18.2.0 react-dom@18.2.0

# 2️⃣ Fijar Payload y plugins compatibles con React 18
Write-Host "🔹 Instalando Payload 3.37.0 y plugins compatibles..."
pnpm add @payloadcms/next@3.37.0 @payloadcms/db-sqlite@3.37.0 @payloadcms/plugin-cloud-storage@3.37.0 @payloadcms/richtext-lexical@3.37.0 @payloadcms/storage-s3@3.37.0 @payloadcms/translations@3.37.0 @payloadcms/ui@3.37.0 payload@3.37.0

# 3️⃣ Limpiar node_modules y lockfile
Write-Host "🧹 Limpiando node_modules y lockfile..."
Remove-Item -Recurse -Force .\node_modules
Remove-Item -Force pnpm-lock.yaml

# 4️⃣ Reinstalar todas las dependencias
Write-Host "📦 Reinstalando todas las dependencias..."
pnpm install

# 5️⃣ Confirmación
Write-Host "✅ Dependencias corregidas. Ahora tu proyecto usa React 18 y Payload 3.37 listo para deploy."
