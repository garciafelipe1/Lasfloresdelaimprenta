# Programa de beneficios — documento para el cliente

Este documento resume **qué estamos implementando** en la tienda (sitio web + Medusa), **qué reglas de negocio aplican** y **qué queda pendiente**. Está escrito en lenguaje claro para alinear expectativas entre el equipo comercial, operaciones y soporte.

---

## 1. Objetivo general

Construir un ecosistema coherente de beneficios para:

- **Clientes del catálogo** (compras puntuales): bienvenida y promociones de catálogo.
- **Miembros de membresía**: programa **Inner Circle** (niveles por antigüedad) y, en una fase posterior, **códigos de referidos** entre miembros.

Todas las reglas acordadas priorizan **claridad**, **control del margen** y **una sola promoción por pedido** cuando corresponda.

---

## 2. Lo ya implementado o en curso (estado técnico)

### 2.1 Cupón de bienvenida (10% — primera compra en catálogo)

- **Qué es:** al completar el registro y el formulario de bienvenida, el sistema genera un **código único** por persona, con **vigencia limitada** y **un solo uso** en pedido completado.
- **Alcance:** **solo productos del catálogo**. Los productos de **membresía** quedan **excluidos** del descuento.
- **Cómo se configura en producción:** en el servidor Medusa se definen los **IDs de categoría** del catálogo o los **IDs de producto** de membresía a excluir (variables de entorno documentadas en `.env.template`). En el sitio público se replica la lista de productos de membresía para **no auto-aplicar** el cupón si el carrito solo contiene esos productos.
- **Una promoción por pedido:** si el usuario aplica un cupón manualmente, **no se acumula** con otro: el carrito queda con **un solo código promocional activo**.

### 2.2 Inner Circle (miembros con membresía activa)

- **Qué es:** tres niveles de reconocimiento según **meses de antigüedad** desde la **primera compra de membresía** en el sitio (fecha de inicio de la suscripción que usamos como referencia).
- **Niveles y beneficio acordado en catálogo (solo catálogo, no membresías):**

  | Nivel       | Antigüedad (referencia) | Descuento en catálogo |
  | ----------- | ----------------------- | --------------------- |
  | Lead Sólido | Meses 1 a 6             | 5%                    |
  | Lead Senior | Meses 6 a 12            | 7%                    |
  | Lead VIP    | A partir del mes 12     | 10%                   |

- **Manual vs automático:** el sistema puede **calcular** el nivel por fechas; el equipo puede **fijar o corregir** el nivel y dejar **notas internas** en Medusa (la parte de administración avanzada se va habilitando por etapas).
- **En pantalla:** el **panel del miembro** muestra el nivel Inner Circle cuando tiene membresía activa (nombre del nivel, % acordado para catálogo y fecha de referencia de antigüedad).
- **Cupón en Medusa:** al consultar la suscripción o el panel, el sistema **genera o actualiza** un cupón personal de catálogo (5/7/10% según nivel) con las **mismas exclusiones de membresía** que el cupón de bienvenida (configuración por variables de entorno). En el carrito, si el miembro agrega productos de catálogo, se **prioriza** este cupón sobre el de bienvenida cuando ambos podrían aplicar.

### 2.3 Referidos (implementación base)

- **Código propio (referidor):** visible en el panel cuando pasan **30 días** desde la **primera compra de membresía** en el sitio; formato `RF-…` en metadata y en pantalla.
- **Referido:** puede ingresar código al **registrarse** (campo opcional) o vía API autenticada `POST /store/referral/attach`; recibe cupón **10% catálogo**, **30 días**, **un uso** (promoción `RR-…`).
- **Recompensa al referidor:** cuando un referido **completa una orden que incluye producto de membresía** (IDs configurados en la misma variable que excluye membresías del cupón de bienvenida), el referidor recibe un cupón **10% catálogo**, **30 días**, **un uso** (`RV-…`), con **tope de 3 recompensas por mes calendario** por referidor.
- **Una promoción por pedido** en el checkout (misma política que el resto del programa).
- **Búsqueda del referidor por código:** hoy se recorren clientes por lotes (adecuado para volúmenes moderados); a escala mayor conviene índice dedicado.

---

## 3. Resumen de reglas globales

| Tema         | Regla                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Membresías   | Los cupones de **catálogo** (bienvenida, Inner Circle cuando esté ligado a promo, referidos) **no aplican** a productos de membresía salvo definición explícita futura. |
| Apilamiento  | **No** se combinan varias promociones en el mismo pedido: **una sola** promoción activa.                                                                                |
| Inner Circle | Solo **miembros con membresía activa**; niveles según antigüedad o ajuste manual.                                                                                       |

---

## 4. Nota para integraciones (equipo técnico)

El endpoint autenticado `GET /membership/subscription/me` devuelve un objeto con:

- `subscriptions`: suscripciones activas (antes era solo el array en la raíz).
- `innerCircle`: nivel Inner Circle calculado o `null` si no aplica.

Las apps que consumían la respuesta como **array puro** deben actualizarse.

---

## 5. Qué debe completar el cliente / operación

1. **IDs en Medusa:** confirmar en el admin los **IDs de producto** (o categorías) que representan los **paquetes de membresía** y el **catálogo**, para que las exclusiones y futuras promos sean correctas en producción.
2. **Textos legales:** párrafos de privacidad / uso de datos del formulario de bienvenida (cuando los definan).
3. **Referidos:** cuando den luz verde a la fase técnica, validar que las reglas de la tabla anterior sigan vigentes.

---

## 6. Mantenimiento del documento

Este archivo vive en el repositorio (`docs/cliente-beneficios-e-implementacion.md`) y puede actualizarse cuando cambien reglas comerciales o se complete una nueva fase de desarrollo.

_Última actualización: documentación alineada al desarrollo del programa de beneficios (bienvenida, Inner Circle, roadmap referidos)._
