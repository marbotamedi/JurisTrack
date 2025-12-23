import { addBusinessDays } from "../utils/dateUtils.js";
import { withTenantFilter } from "../repositories/tenantScope.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";

/**
 * Serviço responsável pela lógica de finalização do processo via N8N.
 * - Busca o prazo
 * - Calcula dias úteis
 * - Atualiza tabelas Prazo e upload_Documentos
 */
export const finalizeProcess = async (uploadId, publicacaoId, tenantId) => {
  logInfo("n8n.finalize.start", "Iniciando finalização do processo", {
    uploadId,
    publicacaoId,
    tenantId,
  });

  // Garantir que o upload pertence ao tenant
  const { data: uploadDoc, error: uploadError } = await withTenantFilter(
    "upload_Documentos",
    tenantId
  )
    .select("id")
    .eq("id", uploadId)
    .maybeSingle();

  if (uploadError || !uploadDoc) {
    const message = `Upload ${uploadId} não encontrado para o tenant informado. ${uploadError?.message || ""}`.trim();
    logWarn("n8n.finalize.upload_not_found", message, {
      uploadId,
      publicacaoId,
      tenantId,
      error: uploadError,
    });
    throw new Error(message);
  }

  // 1. Buscar os dados de Prazo que o n8n inseriu
  const { data: prazo, error: prazoError } = await withTenantFilter(
    "Prazo",
    tenantId
  )
    .select("data_inicio, dias, id")
    .eq("publicacaoid", publicacaoId)
    .maybeSingle();

  if (prazoError || !prazo) {
    const message = `Falha ao buscar prazo para publicacaoId ${publicacaoId}: ${prazoError?.message}`;
    logWarn("n8n.finalize.prazo_not_found", message, {
      uploadId,
      publicacaoId,
      tenantId,
      error: prazoError,
    });
    throw new Error(message);
  }

  // Validação se o prazo tem dados suficientes para cálculo
  if (!prazo.data_inicio || !prazo.dias || prazo.dias <= 0) {
    logWarn(
      "n8n.finalize.prazo_incomplete",
      "Prazo sem data_inicio ou dias válidos. Pulando cálculo.",
      { prazoId: prazo.id, tenantId, uploadId, publicacaoId }
    );
  } else {
    // 2. CALCULAR A DATA LIMITE (Regra de Negócio)
    logInfo("n8n.finalize.calculate", "Calculando data limite do prazo", {
      prazoId: prazo.id,
      tenantId,
      uploadId,
      publicacaoId,
      dataInicio: prazo.data_inicio,
      dias: prazo.dias,
    });

    const dataLimiteCalculada = await addBusinessDays(
      prazo.data_inicio,
      prazo.dias
    );

    // Formata para salvar no banco (YYYY-MM-DD)
    const dataLimiteFormatada = dataLimiteCalculada.format("YYYY-MM-DD");

    // 3. Salvar a data limite na tabela Prazo
    const { error: updatePrazoError } = await withTenantFilter(
      "Prazo",
      tenantId
    )
      .update({
        data_limite: dataLimiteFormatada,
      })
      .eq("id", prazo.id);

    if (updatePrazoError) {
      const message = `Falha ao salvar data_limite no prazo ${prazo.id}: ${updatePrazoError.message}`;
      logError("n8n.finalize.update_prazo_failed", message, {
        prazoId: prazo.id,
        tenantId,
        uploadId,
        publicacaoId,
        error: updatePrazoError,
      });
      throw new Error(message);
    }
    logInfo("n8n.finalize.update_prazo_success", "Prazo atualizado", {
      prazoId: prazo.id,
      tenantId,
      uploadId,
      publicacaoId,
      dataLimite: dataLimiteFormatada,
    });
  }

  // 4. ATUALIZAR O STATUS do Upload para "processado"
  const { error: updateStatusError } = await withTenantFilter(
    "upload_Documentos",
    tenantId
  )
    .update({ status: "processado" })
    .eq("id", uploadId);

  if (updateStatusError) {
    const message = `Falha ao atualizar status do upload ${uploadId}: ${updateStatusError.message}`;
    logError("n8n.finalize.update_upload_failed", message, {
      uploadId,
      publicacaoId,
      tenantId,
      error: updateStatusError,
    });
    throw new Error(message);
  }

  logInfo("n8n.finalize.update_upload_success", "Status do upload atualizado", {
    uploadId,
    publicacaoId,
    tenantId,
  });

  return { message: "Processo finalizado com sucesso." };
};
