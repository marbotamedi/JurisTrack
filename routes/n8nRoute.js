import express from "express";
import supabase from "../config/supabase.js";
import { addBusinessDays } from "../utils/dateUtils.js";

const router = express.Router();

// =======================================================
//   ROTA WEBHOOK N8N: (FINALIZAÇÃO DO PROCESSO)
//   URL final será: POST /upload/n8n/complete
// =======================================================
router.post("/complete", async (req, res) => {
  // n8n deve enviar no body: { uploadId: 123, publicacaoId: "uuid-..." }
  const { uploadId, publicacaoId } = req.body;

  if (!uploadId || !publicacaoId) {
    return res.status(400).json({
      error: "uploadId e publicacaoId são obrigatórios.",
    });
  }

  console.log(
    `[n8n/complete] Recebido. UploadID: ${uploadId}, PublicacaoID: ${publicacaoId}`
  );

  try {
    // 1. Buscar os dados de Prazo que o n8n inseriu
    const { data: prazo, error: prazoError } = await supabase
      .from("Prazo")
      .select("data_inicio, dias, id")
      .eq("publicacaoId", publicacaoId)
      .single();

    if (prazoError || !prazo) {
      throw new Error(
        `Falha ao buscar prazo para publicacaoId ${publicacaoId}: ${prazoError?.message}`
      );
    }
    
    if (!prazo.data_inicio || !prazo.dias || prazo.dias <= 0) {
      console.warn(
        `[n8n/complete] Prazo ${prazo.id} não possui data_inicio ou dias. Pulando cálculo.`
      );
      // Mesmo sem prazo, o processamento terminou.
    } else {
      // 2. CALCULAR A DATA LIMITE
      console.log(
        `[n8n/complete] Calculando data limite... Início: ${prazo.data_inicio}, Dias: ${prazo.dias}`
      );

      const dataLimiteCalculada = await addBusinessDays(
        prazo.data_inicio,
        prazo.dias
      );
      const dataLimiteFormatada = dataLimiteCalculada.format("YYYY-MM-DD");

      // 3. Salvar a data limite na tabela Prazo
      const { error: updatePrazoError } = await supabase
        .from("Prazo")
        .update({
          data_limite: dataLimiteFormatada,
          //data_fim: dataLimiteFormatada,
        })
        .eq("id", prazo.id);

      if (updatePrazoError) {
        throw new Error(
          `Falha ao salvar data_limite no prazo ${prazo.id}: ${updatePrazoError.message}`
        );
      }
      console.log(
        `[n8n/complete] Prazo ${prazo.id} atualizado com data limite: ${dataLimiteFormatada}`
      );
    }

    // 4. ATUALIZAR O STATUS para "processado"
    const { error: updateStatusError } = await supabase
      .from("upload_Documentos")
      .update({ status: "processado" })
      .eq("id", uploadId);

    if (updateStatusError) {
      throw new Error(
        `Falha ao atualizar status do upload ${uploadId}: ${updateStatusError.message}`
      );
    }

    console.log(`[n8n/complete] Status do Upload ${uploadId} atualizado.`);
    res.status(200).json({ message: "Processo finalizado com sucesso." });
  } catch (error) {
    console.error("[n8n/complete] Erro no webhook de finalização:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;