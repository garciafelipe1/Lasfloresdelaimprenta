# Custom CLI Script

A custom CLI script is a function to execute through Medusa's CLI tool. This is useful when creating custom Medusa tooling to run as a CLI tool.

> Learn more about custom CLI scripts in [this documentation](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts).

## How to Create a Custom CLI Script?

To create a custom CLI script, create a TypeScript or JavaScript file under the `src/scripts` directory. The file must default export a function.

For example, create the file `src/scripts/my-script.ts` with the following content:

```ts title="src/scripts/my-script.ts"
import { 
  ExecArgs,
} from "@medusajs/framework/types"

export default async function myScript ({
  container
}: ExecArgs) {
  const productModuleService = container.resolve("product")

  const [, count] = await productModuleService.listAndCountProducts()

  console.log(`You have ${count} product(s)`)
}
```

The function receives as a parameter an object having a `container` property, which is an instance of the Medusa Container. Use it to resolve resources in your Medusa application.

---

## How to Run Custom CLI Script?

To run the custom CLI script, run the `exec` command:

```bash
npx medusa exec ./src/scripts/my-script.ts
```

---

## Custom CLI Script Arguments

Your script can accept arguments from the command line. Arguments are passed to the function's object parameter in the `args` property.

For example:

```ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function myScript ({
  args
}: ExecArgs) {
  console.log(`The arguments you passed: ${args}`)
}
```

Then, pass the arguments in the `exec` command after the file path:

```bash
npx medusa exec ./src/scripts/my-script.ts arg1 arg2
```

---

## Migración: Día de la Mujer → Diseños Exclusivos

Tras renombrar la categoría en el sitio a **"Diseños Exclusivos"**, los productos en la base de datos siguen con la categoría antigua **"Día de la Mujer"**, por eso el frontend (que filtra por nombre de categoría) no los muestra.

### Pasos recomendados (sin borrar productos ni perder datos)

1. **Simular** (opcional): ejecutar en modo solo lectura para ver qué se movería:
   ```bash
   DRY_RUN=true pnpm run migrate:dia-mujer-to-disenios-exclusivos
   ```

2. **Ejecutar la migración**: mueve productos a "Diseños Exclusivos" y "Complementos Exclusivos" (crea categorías si no existen):
   ```bash
   DRY_RUN=false pnpm run migrate:dia-mujer-to-disenios-exclusivos
   ```

3. **Seeds**: los productos de esta categoría están definidos en:
   - `seed/products/disenios-exclusivos.seed.ts` (export `diseniosExclusivos`)
   - `seed/products/complementos-exclusivos.seed.ts` (export `complementosExclusivos`)
   Ambos usan `CATEGORIES.sanValentin` y `CATEGORIES.complementosSanValentin` como única fuente de verdad.

4. **Actualizar contenido** de productos (títulos, descripciones, imágenes, precios de variantes):
   ```bash
   pnpm run update:disenios-exclusivos-content
   ```