import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

//   ROTA MODAL 1: (RESULTADO DO PROCESSAMENTO)

router.get("/resultado/:nome", async (req, res) => {
  const { nome } = req.params; // Este é o 'nome_arquivo'

  try {
    // Achar o uploadId a partir do nome_arquivo
    const { data: uploadDoc, error: uploadError } = await supabase
      .from("upload_Documentos")
      .select("id")
      .eq("nome_arquivo", nome)
      .single();

    if (uploadError || !uploadDoc) {
      return res
        .status(404)
        .json({ error: "Documento de upload não encontrado." });
    }

    const uploadId = uploadDoc.id;

    // Buscar as Publicações ligadas a esse uploadId
    const { data: publicacoes, error: pubError } = await supabase
      .from("Publicacao")
      .select("id, data_publicacao, processoId")
      .eq("uploadId", uploadId); // Usando a nova coluna!

    if (pubError) {
      throw new Error(`Erro ao buscar publicações: ${pubError.message}`);
    }

    if (!publicacoes || publicacoes.length === 0) {
      return res.status(404).json({
        error:
          "Nenhum resultado de processamento encontrado para este arquivo.",
      });
    }

    // Para cada publicação, buscar seus dados relacionados
    const resultadosCalculados = [];

    for (const pub of publicacoes) {
      // Busca o Processo (para pegar o número)
      const { data: processo } = await supabase
        .from("Processos")
        .select("numero")
        .eq("id", pub.processoId)
        .single();

      // Busca o Prazo (que já foi calculado e salvo pelo /n8n/complete)
      const { data: prazo } = await supabase
        .from("Prazo")
        .select("dias, data_limite")
        .eq("publicacaoId", pub.id)
        .single(); // Assumindo 1 prazo por publicação

      // Busca o Andamento (para pegar a data do evento)
      const { data: andamento } = await supabase
        .from("Andamento")
        .select("data_evento")
        .eq("publicacaoId", pub.id)
        .order("data_evento", { ascending: false }) // Pega o mais recente
        .limit(1)
        .single();

      // Monta o objeto que o frontend espera
      resultadosCalculados.push({
        numero_processo: processo?.numero || "N/A",
        nova_movimentação: andamento?.data_evento || null,
        data_publicacao: pub.data_publicacao,
        prazo_entrega: prazo?.dias || 0,
        // Pega o valor que o /n8n/complete calculou e salvou!
        data_vencimento_calculada: prazo?.data_limite || null,
      });
    }

    // O frontend (upload.js) já está pronto para receber um array
    res.status(200).json(resultadosCalculados);
  } catch (error) {
    console.error("Erro ao buscar resultado:", error);
    return res.status(500).json({ error: "Erro interno ao buscar resultado." });
  }
});


//   ROTA MODAL 2: (HISTÓRICO DO PROCESSO)

router.get("/publicacoes/processo/:numero", async (req, res) => {
  const { numero } = req.params;

  if (!numero) {
    return res.status(400).json({ error: "Número do processo é obrigatório." });
  }

  try {
    // 1. Achar o ID do processo a partir do número
    const { data: processo, error: processoError } = await supabase
      .from("Processos")
      .select("id")
      .eq("numero", numero)
      .single();

    if (processoError || !processo) {
      console.warn(`[API] Processo não encontrado pelo número: ${numero}`);
      return res.status(404).json({ error: "Processo não encontrado." });
    }

    // 2. Buscar todas as publicações (texto e data) desse processoId
    const { data: publicacoes, error: pubError } = await supabase
      .from("Publicacao")
      .select("data_publicacao, texto_integral") // Pega só o que precisamos
      .eq("processoId", processo.id) // Usa o ID (UUID) que encontramos
      .order("data_publicacao", { ascending: false }); // Mais recentes primeiro

    if (pubError) {
      console.error("Erro ao buscar publicações do processo:", pubError);
      return res.status(500).json({ error: "Erro ao buscar publicações." });
    }

    // 3. Retorna o array de publicações
    res.status(200).json(publicacoes);
  } catch (error) {
    console.error("Erro na rota /publicacoes/processo:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});


export default router;