import * as uploadService from "../services/uploadService.js";

// Função para limpar o ID e evitar erro de UUID inválido
const tratarId = (id) => {
  if (!id) return null;
  if (id === "undefined") return null;
  if (id === "null") return null;
  if (id.trim() === "") return null;
  return id;
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Pega os dados extras enviados pelo FormData
    const { numProcesso } = req.body;
    
    // TRATAMENTO ESSENCIAL: Limpa o ID antes de passar pro Service
    const processoId = tratarId(req.body.processoId);

    // Passa os novos parâmetros para o serviço
    const result = await uploadService.uploadFileToStorage(req.file, numProcesso, processoId);

    res.status(200).json({
      message: "Arquivo enviado com sucesso",
      ...result,
    });
  } catch (error) {
    console.error("Erro no controller de upload:", error);
    if (error.statusCode === "409") {
      return res.status(409).json({ error: "Arquivo em duplicidade." });
    }
    // Retorna o erro real para facilitar o debug no console do navegador
    res.status(500).json({ error: error.message || "Erro ao processar upload." });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    await uploadService.deleteDocument(id);
    res.status(204).send(); // 204 No Content (Sucesso sem corpo)
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    res.status(500).json({ error: error.message });
  }
};

export const listPublications = async (req, res) => {
  try {
    // Também limpa o ID na listagem
    const processoId = tratarId(req.query.processoId);

    let documentos;
    if (processoId) {
      documentos = await uploadService.listDocumentsByProcess(processoId);
    } else {
      documentos = await uploadService.listAllDocuments();
    }
    
    res.status(200).json(documentos);
  } catch (error) {
    console.error("Erro ao listar:", error);
    res.status(500).json({ error: "Erro ao listar publicações." });
  }
};