import { logWarn } from "./logger.js";

const MISSING_TENANT_MESSAGE = "tenantId não encontrado no contexto da requisição.";
const TENANT_MISMATCH_MESSAGE =
  "Usuário não pertence ao tenant do contexto.";

/**
 * Garante que o usuário autenticado pertence ao tenant presente no contexto.
 * Retorna false quando a requisição já foi respondida com erro.
 */
export function ensureTenantAuthorization(req, res) {
  const requestTenantId = req?.tenantId;
  const tokenTenantId = req?.user?.tenantId;
  const userId = req?.user?.id;

  if (!requestTenantId) {
    logWarn("authz.tenant.missing_context", MISSING_TENANT_MESSAGE, {
      path: req?.path,
      method: req?.method,
      userId,
    });
    res?.status?.(400)?.json({ message: MISSING_TENANT_MESSAGE });
    return false;
  }

  if (tokenTenantId && tokenTenantId !== requestTenantId) {
    logWarn("authz.tenant.mismatch", TENANT_MISMATCH_MESSAGE, {
      path: req?.path,
      method: req?.method,
      tenantId: requestTenantId,
      tokenTenantId,
      userId,
    });
    res?.status?.(403)?.json({ message: TENANT_MISMATCH_MESSAGE });
    return false;
  }

  return true;
}

