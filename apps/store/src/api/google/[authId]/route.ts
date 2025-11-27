import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const authId = req.params.authId;
  console.log("El auth ID es: "+authId)
  const authModuleService = req.scope.resolve(Modules.AUTH);
  const identity = (await authModuleService.listProviderIdentities()).filter(
    (iden) => iden.auth_identity_id === authId
  );
  console.log("La identity es: "+identity)
  res.json(identity.length > 0 ? identity[0].user_metadata : null);
}
