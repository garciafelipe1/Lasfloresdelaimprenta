/**
 * POST /store/auth/google/link-customer
 *
 * Cuando Medusa devuelve un JWT con actor_id vacío (usuarios nuevos con Google),
 * este endpoint crea el customer, vincula la auth identity y devuelve un nuevo token
 * con actor_id para que /store/customers/me funcione.
 *
 * Body: ninguno. Header: Authorization: Bearer <token_con_actor_id_vacío>
 * Response: { token: string } (nuevo JWT con actor_id)
 */

import type { ConfigModule } from "@medusajs/framework/types";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
import * as crypto from "crypto";

const JWT_HEADER = Buffer.from(
  JSON.stringify({ alg: "HS256", typ: "JWT" })
).toString("base64url");
const DEFAULT_JWT_SECRET = "supersecret";

type JwtPayload = {
  actor_id?: string;
  actor_type?: string;
  auth_identity_id?: string;
  app_metadata?: Record<string, unknown>;
  iat?: number;
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(raw) as JwtPayload;
  } catch {
    return null;
  }
}

function signJwt(
  payload: Record<string, unknown>,
  secret: string
): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const message = `${JWT_HEADER}.${payloadB64}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("base64url");
  return `${message}.${sig}`;
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const authModuleService = req.scope.resolve(Modules.AUTH);
  const configModule = req.scope.resolve<ConfigModule>("configModule");
  const jwtSecret =
    configModule?.projectConfig?.http?.jwtSecret ?? DEFAULT_JWT_SECRET;

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    res.status(401).json({
      message: "Missing Authorization: Bearer <token>",
    });
    return;
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.auth_identity_id) {
    logger.warn("[link-customer] Token sin auth_identity_id");
    res.status(400).json({
      message: "Invalid token: missing auth_identity_id",
    });
    return;
  }

  if (payload.actor_id && payload.actor_id.length > 0) {
    logger.info("[link-customer] Token ya tiene actor_id, no hace falta vincular");
    res.json({ token });
    return;
  }

  const identities = await authModuleService.listProviderIdentities();
  const identity = identities.find(
    (i) => i.auth_identity_id === payload.auth_identity_id
  );
  if (!identity) {
    logger.warn("[link-customer] Identity no encontrada:", payload.auth_identity_id);
    res.status(404).json({
      message: "Auth identity not found",
    });
    return;
  }

  let customerId: string;
  try {
    const { result } = await createCustomerAccountWorkflow(req.scope).run({
      input: {
        auth_identity_id: payload.auth_identity_id,
      },
    });
    const raw = result as { id?: string; customer?: { id: string } } | { id: string }[] | undefined;
    const customer = Array.isArray(raw)
      ? raw[0]
      : raw?.customer ?? raw;
    customerId = customer?.id;
    if (!customerId) {
      logger.warn("[link-customer] Workflow no devolvió customer id. result:", JSON.stringify(result)?.slice(0, 200));
      res.status(500).json({
        message: "Workflow did not return customer",
      });
      return;
    }
    logger.info("[link-customer] createCustomerAccountWorkflow OK, customer_id:", customerId);
  } catch (err: any) {
    logger.error("[link-customer] Error en createCustomerAccountWorkflow:", err?.message);
    res.status(500).json({
      message: "Failed to create customer account",
    });
    return;
  }

  const newPayload: Record<string, unknown> = {
    ...payload,
    actor_id: customerId,
    actor_type: "customer",
    app_metadata: {
      ...(payload.app_metadata ?? {}),
      customer_id: customerId,
    },
  };
  const newToken = signJwt(newPayload, jwtSecret);
  res.json({ token: newToken });
};
