import * as modalService from "../services/modalService.js";
import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError, logWarn } from "../utils/logger.js";

export const getResult = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { nome } = req.params; // nome_arquivo

  try {
    const resultados = await modalService.getProcessingResult(
      nome,
      req.tenantId
    );

    if (resultados.length === 0) {
      return res.status(404).json({
        error: "Nenhum resultado de processamento encontrado para este arquivo.",
      });
    }

    res.status(200).json(resultados);
  } catch (error) {
    // Tratamento simples: se a msg for "não encontrado", devolve 404, senão 500
    if (error.message.includes("não encontrado")) {
      return res.status(404).json({ error: error.message });
    }
    logError("modal.controller.result_error", "Erro ao buscar resultado do processamento", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      nomeArquivo: nome,
      error,
    });
    return res.status(500).json({ error: "Erro interno ao buscar resultado." });
  }
};

export const getHistory = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { numero } = req.params;

  if (!numero) {
    logWarn("modal.controller.history_validation", "Número do processo é obrigatório.", {
      tenantId: req.tenantId,
      userId: req.user?.id,
    });
    return res.status(400).json({ error: "Número do processo é obrigatório." });
  }

  try {
    const publicacoes = await modalService.getProcessHistory(
      numero,
      req.tenantId
    );
    res.status(200).json(publicacoes);
  } catch (error) {
    if (error.message === "Processo não encontrado.") {
      return res.status(404).json({ error: error.message });
    }
    logError("modal.controller.history_error", "Erro na rota /publicacoes/processo", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      numero,
      error,
    });
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getFullData = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { pubId } = req.params;

  try {
    const flatData = await modalService.getProcessFullData(
      pubId,
      req.tenantId
    );

    if (!flatData) {
      return res.status(404).json({ error: "Publicação não encontrada." });
    }

    res.status(200).json(flatData);
  } catch (error) {
    logError("modal.controller.full_data_error", "Erro ao buscar dados do processo", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      publicacaoId: pubId,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};