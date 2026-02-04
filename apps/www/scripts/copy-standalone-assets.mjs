import path from 'node:path'
import { access, cp, mkdir } from 'node:fs/promises'

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  const root = process.cwd() // apps/www

  const standaloneRoot = path.join(root, '.next', 'standalone')
  if (!(await exists(standaloneRoot))) {
    console.log('[postbuild] No existe .next/standalone, salto copy de assets.')
    return
  }

  // En monorepo, Next standalone suele generar apps/www/server.js
  const candidates = [
    path.join(standaloneRoot, 'apps', 'www'),
    standaloneRoot,
  ]

  let appRoot = null
  for (const c of candidates) {
    if (await exists(path.join(c, 'server.js'))) {
      appRoot = c
      break
    }
  }

  if (!appRoot) {
    console.log('[postbuild] No encontré server.js dentro de standalone, salto.')
    return
  }

  const srcPublic = path.join(root, 'public')
  const srcStatic = path.join(root, '.next', 'static')

  const dstPublic = path.join(appRoot, 'public')
  const dstStatic = path.join(appRoot, '.next', 'static')

  await mkdir(path.dirname(dstPublic), { recursive: true })
  await mkdir(path.dirname(dstStatic), { recursive: true })

  if (await exists(srcPublic)) {
    await cp(srcPublic, dstPublic, { recursive: true, force: true })
    console.log(`[postbuild] Copiado public -> ${path.relative(root, dstPublic)}`)
  } else {
    console.log('[postbuild] No existe public/, salto.')
  }

  if (await exists(srcStatic)) {
    await cp(srcStatic, dstStatic, { recursive: true, force: true })
    console.log(`[postbuild] Copiado .next/static -> ${path.relative(root, dstStatic)}`)
  } else {
    console.log('[postbuild] No existe .next/static, salto.')
  }
}

main().catch((err) => {
  console.error('[postbuild] Error copiando assets:', err)
  process.exit(1)
})

