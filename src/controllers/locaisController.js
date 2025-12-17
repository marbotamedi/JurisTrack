import * as locaisService from "../services/locaisService.js";

// --- Estados ---
export const getEstados = async (req, res) => {
  try {
    const lista = await locaisService.listarEstados(req.query.busca);
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postEstado = async (req, res) => {
  try {
    const resultado = await locaisService.salvarEstado(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEstado = async (req, res) => {
  try {
    await locaisService.deletarEstado(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Cidades ---
export const getCidades = async (req, res) => {
  try {
    const lista = await locaisService.listarCidades(req.query.busca);
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postCidade = async (req, res) => {
  try {
    const resultado = await locaisService.salvarCidade(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCidade = async (req, res) => {
  try {
    await locaisService.deletarCidade(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};