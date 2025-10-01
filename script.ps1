# Script PowerShell para actualizar React y ReactDOM a la versión 19

# 1️⃣ Ir al directorio del proyecto (ajustar si es necesario)
Set-Location -Path ".\apps\www"

# 2️⃣ Hacer backup del package.json actual
Copy-Item package.json package.json.backup
Write-Host "Backup de package.json creado: package.json.backup"

# 3️⃣ Instalar React 19 y ReactDOM 19
Write-Host "Instalando React 19 y ReactDOM 19..."
pnpm add react@^19 react-dom@^19 --save

# 4️⃣ Verificar que las versiones se actualizaron
Write-Host "Verificando versiones instaladas..."
pnpm list react react-dom

# 5️⃣ Opcional: actualizar peerDependencies automáticamente
Write-Host "Actualizando peerDependencies en package.json..."
npx npm-check-updates -u "react" "react-dom"

# 6️⃣ Instalar todas las dependencias nuevamente
Write-Host "Instalando dependencias..."
pnpm install

# 7️⃣ Mensaje final
Write-Host "React y ReactDOM han sido actualizados a la versión 19. Listo para build y deploy."
