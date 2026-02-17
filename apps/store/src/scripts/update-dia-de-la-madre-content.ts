import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { diaDeLaMadre } from "./seed/products/dia-de-la-madre.seed";
import slugify from "slugify";

const toHandle = (value: string) =>
    slugify(value, { lower: true, trim: true, strict: true });

/**
 * Mapeo de handles/títulos antiguos a nuevos
 * Handle antiguo o nuevo -> Datos nuevos del seed
 */
const PRODUCT_MAPPING: Record<string, any> = {
    // Handles antiguos
    "dulce-complicidad": diaDeLaMadre.find((p) => p.title === "Admiración Sutil"),
    "amor-en-equilibrio": diaDeLaMadre.find((p) => p.title === "Fuerza y Equilibrio"),
    "chispa-vital": diaDeLaMadre.find((p) => p.title === "Energía Creadora"),
    "el-clasico-enamorado": diaDeLaMadre.find((p) => p.title === "Reconocimiento Absoluto"),
    "declaracion-absoluta": diaDeLaMadre.find((p) => p.title === "Mujer Líder"),
    "pasion-sin-filtros": diaDeLaMadre.find((p) => p.title === "Determinación Pura"),
    "ternura-infinita": diaDeLaMadre.find((p) => p.title === "Elegancia y Gracia"),
    "box-love-story": diaDeLaMadre.find((p) => p.title === "Box Vanguardia Femenina"),
    "romance-perfumado": diaDeLaMadre.find((p) => p.title === "Esencia Inolvidable"),
    "valentines-gold-edition": diaDeLaMadre.find((p) => p.title === "Edición Oro 8M"),
    // Handles nuevos (por si ya fueron actualizados)
    "admiracion-sutil": diaDeLaMadre.find((p) => p.title === "Admiración Sutil"),
    "fuerza-y-equilibrio": diaDeLaMadre.find((p) => p.title === "Fuerza y Equilibrio"),
    "energia-creadora": diaDeLaMadre.find((p) => p.title === "Energía Creadora"),
    "reconocimiento-absoluto": diaDeLaMadre.find((p) => p.title === "Reconocimiento Absoluto"),
    "mujer-lider": diaDeLaMadre.find((p) => p.title === "Mujer Líder"),
    "determinacion-pura": diaDeLaMadre.find((p) => p.title === "Determinación Pura"),
    "elegancia-y-gracia": diaDeLaMadre.find((p) => p.title === "Elegancia y Gracia"),
    "box-vanguardia-femenina": diaDeLaMadre.find((p) => p.title === "Box Vanguardia Femenina"),
    "esencia-inolvidable": diaDeLaMadre.find((p) => p.title === "Esencia Inolvidable"),
    "edicion-oro-8m": diaDeLaMadre.find((p) => p.title === "Edición Oro 8M"),
};

/**
 * Actualiza contenido de los productos de "Día de la Madre" en la DB:
 * - title (nuevo nombre)
 * - description (nueva descripción)
 * - images + thumbnail
 * - metadata (merge)
 * - precios de variantes (usando X_VARIATIONS del seed)
 *
 * NO borra nada, solo actualiza.
 */
export default async function updateDiaDeLaMadreContent({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const productModuleService = container.resolve(Modules.PRODUCT);
    const pricingModuleService = container.resolve(Modules.PRICING);
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);

    logger.info("[update-dia-de-la-madre-content] Iniciando actualización...");

    // Variaciones de precios para "Día de la Madre" (igual que en seed-products.ts)
    const X_VARIATIONS = [
        { label: "X3", ars: 50_000, usd: 50 },
        { label: "X6", ars: 84_000, usd: 84 },
        { label: "X6 + 1 Lilium", ars: 94_000, usd: 94 },
        { label: "X12", ars: 154_000, usd: 154 },
        { label: "X12 + 1 Lilium", ars: 164_000, usd: 164 },
        { label: "X14", ars: 175_000, usd: 175 },
        { label: "X24", ars: 297_000, usd: 297 },
    ] as const;

    // Obtener todos los productos de "Día de la Madre" con sus variantes y precios
    const { data: products } = await query.graph({
        entity: "product",
        fields: [
            "id",
            "title",
            "handle",
            "categories.name",
            "variants.id",
            "variants.title",
            "variants.options.value",
            "variants.price_set.id",
        ],
    });

    const diaDeLaMadreProducts = (products || []).filter((p: any) =>
        (p?.categories || []).some((c: any) => c?.name === "Día de la Madre")
    );

    logger.info(
        `[update-dia-de-la-madre-content] Encontrados ${diaDeLaMadreProducts.length} productos en "Día de la Madre"`
    );

    let updated = 0;
    let skipped = 0;

    for (const product of diaDeLaMadreProducts as any[]) {
        const oldHandle = product.handle;
        const newData = PRODUCT_MAPPING[oldHandle];

        if (!newData) {
            logger.info(
                `[update-dia-de-la-madre-content] ⏭️  Saltando: ${product.title} (handle: ${oldHandle}) - no hay mapeo`
            );
            skipped++;
            continue;
        }

        const newHandle = toHandle(newData.title);

        // Preparar datos de actualización
        const updateData: any = {
            title: newData.title,
            description: newData.description,
            images: newData.images.map((img: string) => ({ url: img })),
            thumbnail: newData.images[0] || null,
        };

        // Actualizar metadata (merge)
        if (newData.metadata) {
            updateData.metadata = {
                ...(product.metadata || {}),
                ...newData.metadata,
            };
        }

        // Solo actualizar el handle si es diferente Y no existe otro producto con ese handle
        if (oldHandle !== newHandle) {
            // Verificar si ya existe un producto con el nuevo handle
            const existingWithNewHandle = diaDeLaMadreProducts.find(
                (p: any) => p.handle === newHandle && p.id !== product.id
            );

            if (!existingWithNewHandle) {
                updateData.handle = newHandle;
                logger.info(
                    `[update-dia-de-la-madre-content] 🔄 Actualizando handle: ${oldHandle} → ${newHandle}`
                );
            } else {
                logger.info(
                    `[update-dia-de-la-madre-content] ⚠️  Manteniendo handle ${oldHandle} (${newHandle} ya existe)`
                );
            }
        }

        try {
            await productModuleService.updateProducts(String(product.id), updateData);

            // Actualizar precios de variantes
            const variants = (product.variants || []) as any[];
            for (const variant of variants) {
                const variantOptionValue = (variant.options || [])?.[0]?.value;
                if (!variantOptionValue) continue;

                const variation = X_VARIATIONS.find((v) => v.label === variantOptionValue);
                if (!variation) {
                    logger.warn(
                        `[update-dia-de-la-madre-content] ⚠️  Variante "${variantOptionValue}" no encontrada en X_VARIATIONS para ${product.title}`
                    );
                    continue;
                }

                const priceSetId = variant.price_set?.id as string | undefined;
                if (!priceSetId) {
                    // Si no hay price_set, creamos uno y lo linkeamos
                    const created = await pricingModuleService.createPriceSets({
                        prices: [
                            { amount: variation.ars, currency_code: "ars" },
                            { amount: variation.usd, currency_code: "usd" },
                        ],
                    } as any);
                    await remoteLink.create([
                        {
                            [Modules.PRODUCT]: { variant_id: variant.id },
                            [Modules.PRICING]: { price_set_id: created.id },
                        },
                    ]);
                    logger.info(
                        `[update-dia-de-la-madre-content] 💰 Precio creado para variante "${variantOptionValue}" de ${newData.title}`
                    );
                } else {
                    await pricingModuleService.updatePriceSets(priceSetId, {
                        prices: [
                            { amount: variation.ars, currency_code: "ars" },
                            { amount: variation.usd, currency_code: "usd" },
                        ],
                    } as any);
                    logger.info(
                        `[update-dia-de-la-madre-content] 💰 Precio actualizado para variante "${variantOptionValue}" de ${newData.title}: ARS ${variation.ars}, USD ${variation.usd}`
                    );
                }
            }

            logger.info(
                `[update-dia-de-la-madre-content] ✅ Actualizado: "${product.title}" → "${newData.title}" (${product.id})`
            );
            updated++;
        } catch (error: any) {
            logger.error(
                `[update-dia-de-la-madre-content] ❌ Error actualizando ${product.title}: ${error.message}`
            );
        }
    }

    logger.info(
        `[update-dia-de-la-madre-content] ✅ Completado. Actualizados: ${updated}, Saltados: ${skipped}`
    );
}

