import * as modalService from "../services/modalService.js";

export const getResult = async (req, res) => {
  const { nome } = req.params; // nome_arquivo

  try {
    const resultados = await modalService.getProcessingResult(nome);

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
    console.error("Erro ao buscar resultado:", error);
    return res.status(500).json({ error: "Erro interno ao buscar resultado." });
  }
};

export const getHistory = async (req, res) => {
  const { numero } = req.params;

  if (!numero) {
    return res.status(400).json({ error: "Número do processo é obrigatório." });
  }

  try {
    const publicacoes = await modalService.getProcessHistory(numero);
    res.status(200).json(publicacoes);
  } catch (error) {
    if (error.message === "Processo não encontrado.") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Erro na rota /publicacoes/processo:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const getFullData = async (req, res) => {
  const { pubId } = req.params;

  try {
    const flatData = await modalService.getProcessFullData(pubId);

    if (!flatData) {
      return res.status(404).json({ error: "Publicação não encontrada." });
    }

    res.status(200).json(flatData);
  } catch (error) {
    console.error("Erro ao buscar dados do processo:", error.message);
    res.status(500).json({ error: error.message });
  }
};