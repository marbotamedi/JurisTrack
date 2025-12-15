import * as processosService from "../services/processosService.js";

export const listar = async (req, res) => {
  try {
    const filtros = req.query; // Pega filtros da URL (?busca=...&comarca=...)
    const lista = await processosService.listarProcessos(filtros);
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const processo = await processosService.obterProcessoCompleto(id);
    res.status(200).json(processo);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const salvar = async (req, res) => {
  try {
    const dados = req.body;
    const novo = await processosService.criarProcesso(dados);
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const atualizado = await processosService.atualizarProcesso(id, dados);
    res.status(200).json(atualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    await processosService.excluirProcesso(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};