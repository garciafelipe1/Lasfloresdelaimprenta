# floreria

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.1. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Deploy con Root = ./

### Configuración de Vercel

- **Vercel Dashboard**: Root Directory = `./` (raíz del monorepo)
- **Build**: Desde la raíz con `pnpm -F apps/www build`
- **Configuración**: Un único `vercel.json` en la raíz con `outputDirectory: apps/www/.next`
- **Variables de entorno**: Configuradas en Vercel Dashboard

### Estructura del Monorepo

```
Lasfloresdelaimprenta/
├── vercel.json              # Configuración de Vercel
├── package.json             # Monorepo root
├── pnpm-lock.yaml          # Lock file
└── apps/
    └── www/                # Aplicación Next.js
        ├── package.json    # Dependencies de Next.js
        └── .next/          # Build output
```