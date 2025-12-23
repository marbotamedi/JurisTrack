import * as historicoService from "../services/peticaoService.js";
import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError, logWarn } from "../utils/logger.js";

export const salvarLogPeticao = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { publicacao_id, conteudo_final, modelo_utilizado } = req.body;

  // Validação HTTP básica
  if (!publicacao_id || !conteudo_final) {
    logWarn("peticao.controller.validation", "Dados incompletos para salvar log", {
      tenantId: req.tenantId,
      userId: req.user?.id,
    });
    return res.status(400).json({ error: "Dados incompletos." });
  }

  try {
    // Chama o service
    const novoLog = await historicoService.createLogPeticao(
      {
        publicacao_id,
        conteudo_final,
        modelo_utilizado,
      },
      req.tenantId
    );

    // Retorna HTTP
    return res.status(201).json({ 
      message: "Petição salva e logada com sucesso!", 
      id_log: novoLog.id 
    });

  } catch (error) {
    logError("peticao.controller.save_error", "Erro ao salvar log de petição", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      publicacaoId: publicacao_id,
      error,
    });
    return res.status(500).json({ error: "Erro interno ao salvar log." });
  }
};

export const listarHistorico = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  try {
    // O controller não sabe de "Supabase" nem de "Join", só pede os dados
    const historico = await historicoService.getHistoricoFormatado(
      req.tenantId
    );
    
    return res.status(200).json(historico);

  } catch (error) {
    logError("peticao.controller.list_error", "Erro ao listar histórico de petições", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      error,
    });
    return res.status(500).json({ error: "Erro ao buscar histórico." });
  }
};