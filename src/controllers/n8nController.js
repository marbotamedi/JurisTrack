import * as n8nService from "../services/n8nService.js";
import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";

export const completeProcess = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;

  // n8n deve enviar no body: { uploadId: 123, publicacaoId: "uuid-...", tenant_id }
  const { uploadId, publicacaoId } = req.body;
  const bodyTenantId = req.body.tenant_id || req.body.tenantId;
  const tokenTenantId = req.tenantId;

  if (!uploadId || !publicacaoId) {
    logWarn("n8n.complete.validation", "uploadId e publicacaoId são obrigatórios", {
      uploadId,
      publicacaoId,
      tenantId: tokenTenantId,
      userId: req.user?.id,
    });
    return res.status(400).json({
      error: "uploadId e publicacaoId são obrigatórios.",
    });
  }

  if (!bodyTenantId) {
    logWarn("n8n.complete.missing_tenant", "tenant_id ausente no payload do job", {
      uploadId,
      publicacaoId,
      tenantId: tokenTenantId,
      userId: req.user?.id,
    });
    return res.status(422).json({
      error: "tenant_id é obrigatório na payload do job.",
    });
  }

  if (bodyTenantId !== tokenTenantId) {
    logWarn("n8n.complete.tenant_mismatch", "tenant_id do job difere do token", {
      uploadId,
      publicacaoId,
      tenantId: tokenTenantId,
      tokenTenantId: tokenTenantId,
      bodyTenantId,
      userId: req.user?.id,
    });
    return res.status(403).json({
      error: "tenant_id do job não corresponde ao tenant do token.",
    });
  }

  try {
    const resultado = await n8nService.finalizeProcess(
      uploadId,
      publicacaoId,
      tokenTenantId
    );
    logInfo("n8n.complete.success", "Processo finalizado com sucesso", {
      uploadId,
      publicacaoId,
      tenantId: tokenTenantId,
      userId: req.user?.id,
    });
    res.status(200).json(resultado);
  } catch (error) {
    logError("n8n.complete.error", "Erro ao finalizar processo", {
      uploadId,
      publicacaoId,
      tenantId: tokenTenantId,
      userId: req.user?.id,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};