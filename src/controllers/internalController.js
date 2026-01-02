import { findActiveTenantById } from "../repositories/tenantRepository.js";
import { signAuthToken } from "../utils/tokenUtils.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";

/**
 * Gera um token admin para uso interno (ex.: N8N) a partir do tenantId.
 * Protegida por header X-Internal-Secret.
 *
 * Body: { tenantId } ou { tenant_id }
 * Response 200: { token, tenantId, role: "admin" }
 */
export const generateN8nToken = async (req, res) => {
  const configuredSecret = process.env.N8N_INTERNAL_SECRET || "75ggOqPjrDBYROGjdS9cd3ze1tYpumlgL4vo5u75PbskLfIKTeuZucJgSOlfGYGl";
  const providedSecret =
    req.headers["x-internal-secret"] || req.headers["X-Internal-Secret"];

  if (!configuredSecret) {
    logError("internal.n8n.token.misconfig", "N8N_INTERNAL_SECRET ausente", {
      path: req.path,
      method: req.method,
    });
    return res
      .status(500)
      .json({ message: "Configuração interna ausente para emissão de token." });
  }

  if (!providedSecret || providedSecret !== configuredSecret) {
    logWarn("internal.n8n.token.forbidden", "Segredo inválido", {
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({ message: "Forbidden" });
  }

  const tenantId =
    (req.body?.tenantId || req.body?.tenant_id || "").toString().trim();

  if (!tenantId) {
    logWarn("internal.n8n.token.validation", "tenantId é obrigatório", {
      path: req.path,
      method: req.method,
    });
    return res.status(400).json({ message: "tenantId é obrigatório" });
  }

  try {
    const tenant = await findActiveTenantById(tenantId);
    if (!tenant) {
      logWarn(
        "internal.n8n.token.tenant_not_found",
        "Tenant não encontrado ou inativo",
        { tenantId }
      );
      return res
        .status(404)
        .json({ message: "Tenant não encontrado ou inativo" });
    }

    const token = signAuthToken({
      userId: `n8n-${tenantId}`,
      tenantId,
      role: "admin",
    });

    logInfo("internal.n8n.token.issued", "Token emitido para N8N", {
      tenantId,
    });

    return res.status(200).json({
      token,
      tenantId,
      role: "admin",
    });
  } catch (error) {
    logError("internal.n8n.token.error", "Erro ao gerar token para N8N", {
      tenantId,
      error,
    });
    return res.status(500).json({ message: "Erro interno" });
  }
};


