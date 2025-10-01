# =========================
# Script PS1: Fix React 18 + Payload
# =========================

Write-Host "===== 🔧 Iniciando proceso de actualización 🔧 ====="

# 1️⃣ Limpiar node_modules y package-lock.json
Write-Host "🧹 Eliminando node_modules y package-lock.json..."
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue

# 2️⃣ Asegurarse que pnpm o npm estén instalados
Write-Host "⚙️ Verificando npm..."
npm -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm no encontrado. Instalar Node.js antes de continuar."
    exit 1
}

# 3️⃣ Instalar React 18 y ReactDOM 18
Write-Host "⬇️ Instalando React 18..."
npm install react@18.3.1 react-dom@18.3.1 --save

# 4️⃣ Bajar Payload y plugins a versiones compatibles con React 18
Write-Host "⬇️ Instalando Payload 3.37.0 y plugins compatibles..."
npm install payload@3.37.0 @payloadcms/plugin-cloud-storage@3.37.0 @payloadcms/plugin-media@3.37.0 --save

# 5️⃣ Verificar dependencias principales de React
Write-Host "🔎 Verificando versiones de React instaladas..."
npm list react
npm list react-dom

# 6️⃣ Limpiar cache de npm para evitar conflictos
Write-Host "🧹 Limpiando cache de npm..."
npm cache clean --force

# 7️⃣ Reinstalar dependencias restantes
Write-Host "📦 Instalando dependencias restantes..."
npm install --legacy-peer-deps

# 8️⃣ Mensaje final
Write-Host "✅ Actualización completada. React 18 y Payload 3.37 listos para deploy."

Write-Host "💡 Ahora podés probar con: npm run build"
