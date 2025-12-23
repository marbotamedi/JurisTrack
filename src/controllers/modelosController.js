import * as modelosService from "../services/modelosService.js";
import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError, logWarn } from "../utils/logger.js";

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
  if (!ensureTenantAuthorization(req, res)) return;
  const { titulo, descricao, tags, conteudo } = req.body;

  // Validação
  if (!titulo || !conteudo) {
    logWarn("modelos.controller.validation", "Título e Conteúdo são obrigatórios.", {
      tenantId: req.tenantId,
      userId: req.user?.id,
    });
    return res.status(400).json({ error: "Título e Conteúdo são obrigatórios." });
  }

  try {
    const tagsArray = processTags(tags);
    
    const novoModelo = await modelosService.createModelo(
      {
        titulo,
        descricao,
        conteudo,
        tags: tagsArray.length > 0 ? tagsArray : null,
      },
      req.tenantId
    );

    res.status(201).json(novoModelo);
  } catch (error) {
    logError("modelos.controller.create_error", "Erro ao criar modelo", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  try {
    const modelos = await modelosService.listModelos(req.tenantId);
    res.status(200).json(modelos);
  } catch (error) {
    logError("modelos.controller.list_error", "Erro ao listar modelos", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { id } = req.params;

  try {
    const modelo = await modelosService.getModeloById(id, req.tenantId);

    if (!modelo) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json(modelo);
  } catch (error) {
    logError("modelos.controller.fetch_error", "Erro ao buscar modelo", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      modeloId: id,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { id } = req.params;
  const { titulo, descricao, tags, conteudo } = req.body;

  if (!titulo || !conteudo) {
    logWarn("modelos.controller.validation", "Título e Conteúdo são obrigatórios.", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      modeloId: id,
    });
    return res.status(400).json({ error: "Título e Conteúdo são obrigatórios." });
  }

  try {
    const tagsArray = processTags(tags);

    const modeloAtualizado = await modelosService.updateModelo(
      id,
      {
        titulo,
        descricao,
        conteudo,
        tags: tagsArray.length > 0 ? tagsArray : null,
      },
      req.tenantId
    );

    if (!modeloAtualizado) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json(modeloAtualizado);
  } catch (error) {
    logError("modelos.controller.update_error", "Erro ao atualizar modelo", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      modeloId: id,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  const { id } = req.params;

  try {
    const modeloDeletado = await modelosService.deleteModelo(
      id,
      req.tenantId
    );

    if (!modeloDeletado) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json({ message: "Modelo deletado com sucesso.", data: modeloDeletado });
  } catch (error) {
    logError("modelos.controller.delete_error", "Erro ao deletar modelo", {
      tenantId: req.tenantId,
      userId: req.user?.id,
      modeloId: id,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};