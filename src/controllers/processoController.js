import * as processoService from "../services/processoService.js";

export const listar = async (req, res) => {
  try {
    const lista = await processoService.getAllProcessos();
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const buscarUm = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await processoService.getProcessoById(id);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { numprocesso, pasta, obs, descricao, datainicial } = req.body;
    // Adicione validações aqui se necessário
    const novo = await processoService.createProcesso({ 
      numprocesso, pasta, obs, descricao, datainicial 
    });
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const atualizado = await processoService.updateProcesso(id, req.body);
    res.status(200).json(atualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletar = async (req, res) => {
  try {
    const { id } = req.params;
    await processoService.deleteProcesso(id);
    res.status(200).json({ message: "Deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listarPeticoesDoProcesso = async (req, res) => {
  try {
    const { id } = req.params;
    const peticoes = await processoService.getPeticoesByProcesso(id);
    res.status(200).json(peticoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};