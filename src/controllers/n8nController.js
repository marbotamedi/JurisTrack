import * as n8nService from "../services/n8nService.js";

export const completeProcess = async (req, res) => {
  // n8n deve enviar no body: { uploadId: 123, publicacaoId: "uuid-..." }
  const { uploadId, publicacaoId } = req.body;

  if (!uploadId || !publicacaoId) {
    return res.status(400).json({
      error: "uploadId e publicacaoId são obrigatórios.",
    });
  }

  try {
    const resultado = await n8nService.finalizeProcess(uploadId, publicacaoId);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("[n8nController] Erro ao finalizar processo:", error.message);
    res.status(500).json({ error: error.message });
  }
};