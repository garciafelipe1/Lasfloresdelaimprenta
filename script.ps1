# ===============================
# Script para volver a React 18
# y actualizar Payload compatible
# ===============================

# 1️⃣ Fijar React 18 en package.json
Write-Host "🔹 Fijando React y ReactDOM a 18.2.0..."
pnpm add react@18.2.0 react-dom@18.2.0 --save

# 2️⃣ Actualizar Payload a versión compatible con React 18
Write-Host "🔹 Actualizando paquetes @payloadcms a última versión compatible con React 18..."
# Esta versión debe ser la que use React 18
pnpm add @payloadcms/db-sqlite@3.38.0 @payloadcms/next@3.38.0 `
    @payloadcms/plugin-cloud-storage@3.38.0 `
    @payloadcms/richtext-lexical@3.38.0 `
    @payloadcms/storage-s3@3.38.0 `
    @payloadcms/translations@3.38.0 `
    @payloadcms/ui@3.38.0 --save

# 3️⃣ Limpiar node_modules y lockfile para evitar conflictos
Write-Host "🔹 Limpiando node_modules y pnpm-lock.yaml..."
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml

# 4️⃣ Reinstalar dependencias
Write-Host "🔹 Reinstalando dependencias..."
pnpm install

# 5️⃣ Mensaje final
Write-Host "✅ React 18 restaurado y Payload actualizado correctamente."
Write-Host "Ahora podés correr 'pnpm dev' o desplegar en Vercel sin conflictos de React."
