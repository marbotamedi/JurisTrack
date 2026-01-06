import * as uploadService from "../services/uploadService.js";
import { ensureTenantAuthorization } from "../utils/authz.js";
import { logError, logWarn } from "../utils/logger.js";

const tratarId = (id) => {
  if (!id) return null;
  if (id === "undefined") return null;
  if (id === "null") return null;
  if (id.trim() === "") return null;
  return id;
};

export const uploadFile = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const { numProcesso, ignorarN8N } = req.body;
    
    // Tratamento de ID e Flag
    const processoId = tratarId(req.body.processoId);
    
    // Converte string "true" para boolean true. Qualquer outra coisa vira false.
    const deveIgnorarN8N = ignorarN8N === 'true';

    const result = await uploadService.uploadFileToStorage(
      req.file,
      numProcesso,
      processoId,
      req.tenantId,
      deveIgnorarN8N // Passa o booleano correto
    );

    res.status(200).json({
      message: "Arquivo enviado com sucesso",
      ...result,
    });
  } catch (error) {
    // ... logs de erro
    if (error.statusCode === "409") {
      return res.status(409).json({ error: "Arquivo em duplicidade." });
    }
    res.status(500).json({ error: error.message || "Erro ao processar upload." });
  }
};

export const deleteFile = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  try {
    const { id } = req.params;
    await uploadService.deleteDocument(id, req.tenantId);
    res.status(204).send(); 
  } catch (error) {
    logError("upload.controller.delete_error", "Erro ao deletar arquivo", {
      tenantId: req.tenantId,
      error,
    });
    res.status(500).json({ error: error.message });
  }
};

export const listPublications = async (req, res) => {
  if (!ensureTenantAuthorization(req, res)) return;
  try {
    const processoId = tratarId(req.query.processoId);

    let documentos;
    if (processoId) {
      documentos = await uploadService.listDocumentsByProcess(
        processoId,
        req.tenantId
      );
    } else {
      documentos = await uploadService.listAllDocuments(req.tenantId);
    }
    
    res.status(200).json(documentos);
  } catch (error) {
    logError("upload.controller.list_error", "Erro ao listar publicações", {
      tenantId: req.tenantId,
      error,
    });
    res.status(500).json({ error: "Erro ao listar publicações." });
  }
};