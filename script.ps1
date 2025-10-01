# ===============================
# Script para React 18 + Payload compatible
# ===============================

Write-Host "🔹 Actualizando React y Payload..."

# 1️⃣ Actualizar React y ReactDOM a 18.2.0
pnpm add react@18.2.0 react-dom@18.2.0 --save

# 2️⃣ Actualizar Payload y sus plugins a la versión compatible con React 18
pnpm add payload@3.37.0 @payloadcms/plugin-cloud-storage@3.37.0 @payloadcms/next@3.37.0 --save

# 3️⃣ Eliminar node_modules y lock file para limpiar dependencias
Write-Host "🔹 Limpiando node_modules y lock file..."
Remove-Item -Recurse -Force .\node_modules
Remove-Item -Force .\pnpm-lock.yaml

# 4️⃣ Reinstalar dependencias
Write-Host "🔹 Reinstalando dependencias..."
pnpm install

Write-Host "✅ Actualización completada. Ahora React está en 18 y Payload en 3.37.0"
