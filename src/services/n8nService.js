import supabase from "../config/supabase.js";
import { addBusinessDays } from "../utils/dateUtils.js";

/**
 * Serviço responsável pela lógica de finalização do processo via N8N.
 * - Busca o prazo
 * - Calcula dias úteis
 * - Atualiza tabelas Prazo e upload_Documentos
 */
export const finalizeProcess = async (uploadId, publicacaoId) => {
  console.log(
    `[Service] Iniciando finalização. UploadID: ${uploadId}, PublicacaoID: ${publicacaoId}`
  );

  // 1. Buscar os dados de Prazo que o n8n inseriu
  const { data: prazo, error: prazoError } = await supabase
    .from("Prazo")
    .select("data_inicio, dias, id")
    .eq("publicacaoid", publicacaoId)
    .single();

  if (prazoError || !prazo) {
    throw new Error(
      `Falha ao buscar prazo para publicacaoId ${publicacaoId}: ${prazoError?.message}`
    );
  }

  // Validação se o prazo tem dados suficientes para cálculo
  if (!prazo.data_inicio || !prazo.dias || prazo.dias <= 0) {
    console.warn(
      `[Service] Prazo ${prazo.id} não possui data_inicio ou dias válidos. Pulando cálculo.`
    );
  } else {
    // 2. CALCULAR A DATA LIMITE (Regra de Negócio)
    console.log(
      `[Service] Calculando data limite... Início: ${prazo.data_inicio}, Dias: ${prazo.dias}`
    );

    const dataLimiteCalculada = await addBusinessDays(
      prazo.data_inicio,
      prazo.dias
    );

    // Formata para salvar no banco (YYYY-MM-DD)
    const dataLimiteFormatada = dataLimiteCalculada.format("YYYY-MM-DD");

    // 3. Salvar a data limite na tabela Prazo
    const { error: updatePrazoError } = await supabase
      .from("Prazo")
      .update({
        data_limite: dataLimiteFormatada,
      })
      .eq("id", prazo.id);

    if (updatePrazoError) {
      throw new Error(
        `Falha ao salvar data_limite no prazo ${prazo.id}: ${updatePrazoError.message}`
      );
    }
    console.log(
      `[Service] Prazo ${prazo.id} atualizado com data limite: ${dataLimiteFormatada}`
    );
  }

  // 4. ATUALIZAR O STATUS do Upload para "processado"
  const { error: updateStatusError } = await supabase
    .from("upload_Documentos")
    .update({ status: "processado" })
    .eq("id", uploadId);

  if (updateStatusError) {
    throw new Error(
      `Falha ao atualizar status do upload ${uploadId}: ${updateStatusError.message}`
    );
  }

  console.log(
    `[Service] Status do Upload ${uploadId} atualizado para 'processado'.`
  );

  return { message: "Processo finalizado com sucesso." };
};
