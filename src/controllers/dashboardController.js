import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError } from "../utils/logger.js";
import * as dashboardService from "../services/dashboardService.js";

function buildPaginationParams(query = {}) {
  const limit = Number.parseInt(query.limit, 10);
  const offset = Number.parseInt(query.offset, 10);

  return {
    limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : undefined,
  };
}

export const getSummary = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;

  try {
    const summary = await dashboardService.getSummary(req.tenantId);
    res.status(200).json(summary);
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
    const lista = await dashboardService.getPrazosDetalhes(
      req.tenantId,
      buildPaginationParams(req.query)
    );
    res.status(200).json(lista);
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
    const lista = await dashboardService.getAndamentosDetalhes(
      req.tenantId,
      buildPaginationParams(req.query)
    );
    res.status(200).json(lista);
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

