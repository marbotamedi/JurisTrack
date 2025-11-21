import * as uploadService from "../services/uploadService.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const result = await uploadService.uploadFileToStorage(req.file);

    res.status(200).json({
      message: "Arquivo enviado com sucesso",
      ...result,
    });
  } catch (error) {
    console.error("Erro no controller de upload:", error);
    if (error.statusCode === "409") {
      return res.status(409).json({ error: "Arquivo em duplicidade." });
    }
    res.status(500).json({ error: "Erro ao processar upload." });
  }
};

export const listPublications = async (req, res) => {
  try {
    const documentos = await uploadService.listAllDocuments();
    res.status(200).json(documentos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar publicações." });
  }
};