Write-Host "🚀 Ajustando dependencias para React 18 en monorepo con pnpm..."

# Ruta al proyecto donde está package.json
$projectDir = "apps/www"

# Ir al directorio del proyecto
Set-Location $projectDir

# Limpiar node_modules y lockfiles
Write-Host "🧹 Limpiando dependencias..."
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "pnpm-lock.yaml" -ErrorAction SilentlyContinue
Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
Remove-Item -Force "yarn.lock" -ErrorAction SilentlyContinue

# Instalar React 18 y React DOM 18
Write-Host "📦 Instalando React 18..."
pnpm add react@18.3.1 react-dom@18.3.1 --strict-peer-dependencies=false

# Instalar Payload 3.37.0
Write-Host "📦 Instalando Payload 3.37.0..."
pnpm add payload@3.37.0 --strict-peer-dependencies=false

# Instalar plugin-cloud-storage compatible
Write-Host "📦 Instalando @payloadcms/plugin-cloud-storage@3.37.0..."
pnpm add @payloadcms/plugin-cloud-storage@3.37.0 --strict-peer-dependencies=false

# Instalar db-sqlite para la misma versión
Write-Host "📦 Instalando @payloadcms/db-sqlite@3.37.0..."
pnpm add @payloadcms/db-sqlite@3.37.0 --strict-peer-dependencies=false

# Reinstalar todas las dependencias limpias
Write-Host "🔄 Reinstalando todas las dependencias..."
pnpm install --strict-peer-dependencies=false

Write-Host "✅ Dependencias ajustadas: React 18 + Payload 3.37.0 + plugin compatible"
