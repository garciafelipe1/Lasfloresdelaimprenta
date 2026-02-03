import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";
import { getExpandedCategories } from "@/shared/category-mapping";

type Desired = {
  title: string;
  description: string;
  image: string;
};

function normalizeTitle(input: string) {
  return input
    .normalize("NFD")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const DESIRED: Desired[] = [
  {
    title: "Dulce Complicidad",
    description:
      "<p>No todos los amores gritan; los más profundos a veces susurran.</p><p>Este diseño está pensado para ese amor compañero, dulce y leal. Combinamos la sutileza de las <em>rosas crema con bordes rosados</em> con la frescura de las <em>astromelias</em>, todo abrazado por una selección de <em>eucalipto</em> que perfuma el ambiente.</p><ul><li>El mensaje: “Gracias por la calma y la dulzura de todos los días”.</li><li><strong>Presentación:</strong> arpillera rústica para mantener la calidez.</li></ul>",
    image: "/assets/img/productos/san-valentin/dulce-complicidad-1.jpg",
  },
  {
    title: "Amor en Equilibrio",
    description:
      "<p>En una pareja conviven dos fuerzas: la pasión intensa y la transparencia absoluta.</p><ul><li>Este ramo representa esa balanza perfecta. Intercalamos la fuerza icónica de la <em>rosa roja importada</em> con la pureza y luz de las <em>rosas importadas blancas</em>.</li><li>Un contraste visual elegante para parejas que han construido una historia sólida, basada en el deseo y la verdad.</li></ul>",
    image: "/assets/img/productos/san-valentin/amorequilibrio.jpeg",
  },
  {
    title: "Chispa Vital",
    description:
      "<p>San Valentín no es solo rojo.</p><ul><li>Para esos amores que son pura energía, risas y proyectos compartidos, diseñamos esta propuesta fuera de serie. El tono <em>coral</em> y <em>salmón</em> de estas rosas rompe con lo tradicional y habla de un amor joven, moderno y vibrante.</li><li>La sensación: regalar esto es decir “Me encanta la energía que tenés”. Un gesto original para salir del molde clásico.</li></ul>",
    image: "/assets/img/productos/san-valentin/chispavital.jpeg",
  },
  {
    title: "El Clásico Enamorado",
    description:
      "<p>Hay gestos que son eternos por una razón: nunca fallan.</p><ul><li>Este es el ramo por excelencia de San Valentín, pero con el sello de calidad de Las Flores de la Imprenta. <em>Rosas rojas importadas</em>, de apertura perfecta, iluminadas por toques de <em>astromelias blancas</em>.</li><li>Es la apuesta segura para quien quiere reafirmar el “Te Amo” sin correr riesgos.</li><li><strong>Garantía de impacto:</strong> tradicional, generoso y contundente.</li></ul>",
    image: "/assets/img/productos/san-valentin/elclasicoenamorado.jpeg",
  },
  {
    title: "Declaración Absoluta",
    description:
      "<p>Cuando el sentimiento es grande, el regalo no puede quedarse atrás.</p><ul><li>Este diseño se centra en el volumen y la presencia. Seleccionamos <em>rosas rojas de tallo largo</em> y las enmarcamos en un <em>follaje verde intenso</em> que realza la profundidad del color carmín.</li><li><strong>La ocasión:</strong> perfecto para esa cita especial de la noche del 14, donde querés llegar y que el ramo hable por vos antes de decir una palabra.</li></ul>",
    image: "/assets/img/productos/san-valentin/declaracionabsoluta.jpeg",
  },
  {
    title: "Pasión Sin Filtros",
    description:
      "<p>Intensidad en estado puro.</p><ul><li>Acá no hay contrastes ni distracciones: es una marea roja de <em>rosas</em> y <em>astromelias</em> al tono, fusionadas en una sola textura visual de deseo.</li><li>Diseñado para amores apasionados, fogosos y que viven el romance al máximo.</li><li><strong>El detalle:</strong> un ramo que visualmente “enciende” cualquier espacio donde se coloque.</li></ul>",
    image: "/assets/img/productos/san-valentin/pasionsinfiltro.jpeg",
  },
  {
    title: "Ternura Infinita",
    description:
      "<p>El lado más delicado del amor.</p><ul><li>Inspirado en el romance de película, este bouquet combina gamas de <em>rosas</em> y <em>lisianthus rosados</em>, logrando una textura aterciopelada y suave.</li><li>Es un arreglo femenino, sofisticado y de una belleza tranquila.</li><li><strong>El mensaje:</strong> ideal para expresar admiración, cuidado y un cariño profundo. Para tratarla como a una reina.</li></ul>",
    image: "/assets/img/productos/san-valentin/ternurainfinita.jpeg",
  },
  {
    title: "Box Love Story",
    description:
      "<p>Modernizamos la tradición.</p><ul><li>Nuestra Signature Box es una propuesta de diseño contemporáneo para quienes buscan lujo y practicidad. Una estructura rígida desbordante de <em>rosas rojas</em> y varas de <em>conejitos (snapdragons)</em> que aportan altura y elegancia.</li><li><strong>La experiencia:</strong> no requiere florero; llega lista para ser el centro de atención de la cena romántica.</li><li>Un regalo que se siente como una joya.</li></ul>",
    image: "/assets/img/productos/san-valentin/boxlovestory.jpeg",
  },
  {
    title: "Romance Perfumado",
    description:
      "<p>Un regalo que conquista dos sentidos: la vista y el olfato.</p><ul><li>La majestuosidad de los <em>liliums blancos</em> se une a la pasión de las <em>rosas rojas</em> para crear un arreglo de gran porte y jerarquía.</li><li><strong>El factor sorpresa:</strong> los liliums suelen abrirse con el paso de los días, por lo que el ramo va transformándose y perfumando la casa durante toda la semana de San Valentín.</li><li>Un recordatorio constante de tu presencia.</li></ul>",
    image: "/assets/img/productos/san-valentin/romanceperfumado.jpeg",
  },
  {
    title: "Valentine's Gold Edition",
    description:
      "<p>Inspirado en las tendencias de las floristas de París y Corea.</p><ul><li>Dejamos de lado lo rústico para vestir a las <em>rosas rojas</em> con una papelería premium, con texturas satinadas y bordes dorados.</li><li><strong>Para quién es:</strong> para esa persona detallista, amante de la estética y el buen gusto, que valora tanto el contenido como la presentación impecable.</li><li>Es el “Haute Couture” de nuestro catálogo.</li></ul>",
    image: "/assets/img/productos/san-valentin/valentinesgodedition.jpeg",
  },
];

export default async function updateSanValentinContent({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const expanded = getExpandedCategories(CATEGORIES.sanValentin);
  const targets = new Set(expanded);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.name", "metadata"],
  });

  const sanValentinProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => targets.has(c?.name))
  );

  if (!sanValentinProducts.length) {
    logger.info("No hay productos en San Valentín para actualizar.");
    return;
  }

  const byNormTitle = new Map<string, any>();
  for (const p of sanValentinProducts) {
    byNormTitle.set(normalizeTitle(p.title), p);
  }

  for (const desired of DESIRED) {
    const key = normalizeTitle(desired.title);
    const found = byNormTitle.get(key);

    if (!found) {
      logger.warn(`No encontrado en DB para actualizar: "${desired.title}"`);
      continue;
    }

    const images = [{ url: desired.image }];
    const nextMetadata = {
      ...(found.metadata || {}),
      occasion: "San Valentín",
    };

    await productModuleService.updateProducts(found.id, {
      title: desired.title,
      description: desired.description,
      images,
      thumbnail: images[0].url,
      metadata: nextMetadata,
    });

    logger.info(`✅ Actualizado: ${desired.title} (${found.handle})`);
  }
}

