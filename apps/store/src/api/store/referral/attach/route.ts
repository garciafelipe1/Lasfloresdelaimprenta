import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { findReferrerCustomerIdByOwnCode } from "../../../../shared/referral/find-referrer-by-code";
import {
  REFERRAL_REFEREE_PROMO_CODE_KEY,
  REFERRAL_REFEREE_PROMO_ID_KEY,
  REFERRAL_REFERRER_CUSTOMER_ID_KEY,
} from "../../../../shared/referral/metadata-keys";
import {
  createReferralRefereeCatalogPromo,
  deactivatePromotionBestEffort,
  mergeMetadata,
} from "../../../../shared/referral/referral-catalog-promotion";
import { attachReferralSchema } from "./validators";

/**
 * POST /store/referral/attach — vincula un código de referido al customer autenticado
 * y crea el cupón 10% catálogo (30 días, 1 uso) para el referido.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const logger = req.scope.resolve("logger");
  const customerId = req.auth_context.actor_id;
  if (!customerId) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const parsed = attachReferralSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Código inválido",
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const code = parsed.data.code;

  const customerModule = req.scope.resolve(Modules.CUSTOMER);
  const promotionModule = req.scope.resolve(Modules.PROMOTION);

  let self: { metadata?: unknown };
  try {
    self = await customerModule.retrieveCustomer(customerId);
  } catch {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  const selfMeta =
    self?.metadata && typeof self.metadata === "object" && !Array.isArray(self.metadata)
      ? (self.metadata as Record<string, unknown>)
      : {};

  if (selfMeta[REFERRAL_REFERRER_CUSTOMER_ID_KEY]) {
    return res.status(200).json({ ok: true, alreadyAttached: true });
  }

  let referrerId: string | undefined;
  try {
    referrerId = await findReferrerCustomerIdByOwnCode(customerModule, code);
  } catch (e) {
    logger.warn(`[referral/attach] búsqueda referidor: ${e}`);
    return res.status(500).json({ message: "No se pudo validar el código." });
  }

  if (!referrerId) {
    return res.status(400).json({ message: "Código de referido no encontrado." });
  }

  if (referrerId === customerId) {
    return res.status(400).json({ message: "No podés usar tu propio código." });
  }

  const created = await createReferralRefereeCatalogPromo({
    promotionModule,
    logger,
  });

  if (!created) {
    return res.status(500).json({
      message: "No se pudo crear el cupón de referido. Intentá más tarde.",
    });
  }

  try {
    await customerModule.updateCustomers(customerId, {
      metadata: mergeMetadata(self.metadata, {
        [REFERRAL_REFERRER_CUSTOMER_ID_KEY]: referrerId,
        [REFERRAL_REFEREE_PROMO_CODE_KEY]: created.code,
        [REFERRAL_REFEREE_PROMO_ID_KEY]: created.id,
      }),
    });
  } catch (e) {
    logger.error(`[referral/attach] updateCustomers: ${e}`);
    await deactivatePromotionBestEffort({
      promotionModule,
      promotionId: created.id,
      logger,
      logPrefix: "[referral/attach]",
    });
    return res.status(500).json({ message: "No se pudo guardar el vínculo." });
  }

  return res.status(200).json({
    ok: true,
    refereePromoCode: created.code,
  });
}
