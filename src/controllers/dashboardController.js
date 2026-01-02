import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError } from "../utils/logger.js";

const emptySummary = {
  totalProcessos: 0,
  valorCausaTotal: 0,
  prazosUrgentesCount: 0,
  andamentosRecentesCount: 0,
  distribuicaoSituacao: [],
  distribuicaoFase: [],
  topTribunais: [],
};

const emptyList = { items: [] };

export const getSummary = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;

  try {
    res.status(200).json(emptySummary);
  } catch (error) {
    logError(
      "dashboard.controller.summary_error",
      "Erro ao obter resumo do dashboard",
      { tenantId: req.tenantId, userId: req.user?.id, error }
    );
    res.status(500).json({ message: "Erro ao obter resumo do dashboard." });
  }
};

export const getPrazosDetalhes = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;

  try {
    res.status(200).json(emptyList);
  } catch (error) {
    logError(
      "dashboard.controller.prazos_error",
      "Erro ao listar prazos do dashboard",
      { tenantId: req.tenantId, userId: req.user?.id, error }
    );
    res.status(500).json({ message: "Erro ao listar prazos do dashboard." });
  }
};

export const getAndamentosDetalhes = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;

  try {
    res.status(200).json(emptyList);
  } catch (error) {
    logError(
      "dashboard.controller.andamentos_error",
      "Erro ao listar andamentos do dashboard",
      { tenantId: req.tenantId, userId: req.user?.id, error }
    );
    res
      .status(500)
      .json({ message: "Erro ao listar andamentos do dashboard." });
  }
};

