import * as historicoService from "../services/peticaoService.js";

export const salvarLogPeticao = async (req, res) => {
  const { publicacao_id, conteudo_final, modelo_utilizado } = req.body;

  // Validação HTTP básica
  if (!publicacao_id || !conteudo_final) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  try {
    // Chama o service
    const novoLog = await historicoService.createLogPeticao({ 
      publicacao_id, 
      conteudo_final, 
      modelo_utilizado 
    });

    // Retorna HTTP
    return res.status(201).json({ 
      message: "Petição salva e logada com sucesso!", 
      id_log: novoLog.id 
    });

  } catch (error) {
    console.error("Erro no controller:", error.message);
    return res.status(500).json({ error: "Erro interno ao salvar log." });
  }
};

export const listarHistorico = async (req, res) => {
  try {
    // O controller não sabe de "Supabase" nem de "Join", só pede os dados
    const historico = await historicoService.getHistoricoFormatado();
    
    return res.status(200).json(historico);

  } catch (error) {
    console.error("Erro ao listar:", error.message);
    return res.status(500).json({ error: "Erro ao buscar histórico." });
  }
};