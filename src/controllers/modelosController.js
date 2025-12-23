import * as modelosService from "../services/modelosService.js";

// Função auxiliar para tratar tags (String "a,b" -> Array ["a","b"])
const processTags = (tags) => {
  if (tags && typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim());
  }
  if (Array.isArray(tags)) {
    return tags;
  }
  return [];
};

export const create = async (req, res) => {
  const { titulo, descricao, tags, conteudo } = req.body;

  // Validação
  if (!titulo || !conteudo) {
    return res.status(400).json({ error: "Título e Conteúdo são obrigatórios." });
  }

  try {
    const tagsArray = processTags(tags);
    
    const novoModelo = await modelosService.createModelo({
      titulo,
      descricao,
      conteudo,
      tags: tagsArray.length > 0 ? tagsArray : null,
    });

    res.status(201).json(novoModelo);
  } catch (error) {
    console.error("Erro ao criar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const modelos = await modelosService.listModelos();
    res.status(200).json(modelos);
  } catch (error) {
    console.error("Erro ao listar modelos:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const modelo = await modelosService.getModeloById(id);

    if (!modelo) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json(modelo);
  } catch (error) {
    console.error("Erro ao buscar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, tags, conteudo } = req.body;

  if (!titulo || !conteudo) {
    return res.status(400).json({ error: "Título e Conteúdo são obrigatórios." });
  }

  try {
    const tagsArray = processTags(tags);

    const modeloAtualizado = await modelosService.updateModelo(id, {
      titulo,
      descricao,
      conteudo,
      tags: tagsArray.length > 0 ? tagsArray : null,
    });

    if (!modeloAtualizado) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json(modeloAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  const { id } = req.params;

  try {
    const modeloDeletado = await modelosService.deleteModelo(id);

    if (!modeloDeletado) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json({ message: "Modelo deletado com sucesso.", data: modeloDeletado });
  } catch (error) {
    console.error("Erro ao deletar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
};