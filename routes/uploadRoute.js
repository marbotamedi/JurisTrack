import express from "express";
import supabase from "../config/supabase.js";
import { upload } from "../middlewares/multer.js";
import { addBusinessDays } from "../utils/dateUtils.js";
import {
  generateSafeFilename,
  getCurrentSaoPauloTimestamp,
  notifyN8NWebhook,
} from "../utils/utils.js";

const Bucket_Name = "teste";
const router = express.Router();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const file = req.file;

    const fileName = generateSafeFilename(file.originalname);
    const filePath = `${fileName}`;

    // Upload para o Supabase (sem alteração)
    const { data, error } = await supabase.storage
      .from(Bucket_Name)
      .upload(filePath, file.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    // Tratamento de erro do upload (sem alteração)
    if (error) {
      console.error("Erro ao fazer upload para o Supabase:", error);
      if (error.statusCode === "409") {
        return res.status(409).json({ error: "Arquivo em duplicidade." });
      }
      return res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
    }

    // Get Public URL (sem alteração)
    const { data: publicUrlData } = supabase.storage
      .from(Bucket_Name)
      .getPublicUrl(filePath);

    // DATA
    const localDateString = getCurrentSaoPauloTimestamp();

    // Dados para o banco de dados
    const documentData = {
      nome_arquivo: fileName,
      url_publica: publicUrlData.publicUrl,
      data_upload: localDateString,
      status: "pendente",
    };

    // Insert no DB (sem alteração)
    const { data: insertData, error: insertError } = await supabase
      .from("upload_Documentos")
      .insert([documentData])
      .select();

    // Tratamento de erro do insert (sem alteração)
    if (insertError) {
      console.error("Erro ao salvar os dados no Supabase:", insertError);
      return res.status(500).json({
        error: "Erro ao salvar informações do arquivo no banco de dados.",
      });
    }

    // --- LÓGICA DE WEBHOOK SUBSTITUÍDA ---
    if (insertData && insertData.length > 0) {
      const novoID = insertData[0].id;
      // Isso notifica o n8n para COMEÇAR o processo
      notifyN8NWebhook(novoID);
    }

    res.status(200).json({
      message: "Arquivo enviado com sucesso",
      fileName: fileName,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    res.status(500).json({ error: "Erro ao enviar arquivo" });
  }
});

// rota publicações (Sem alterações)
router.get("/publicacoes", async (req, res) => {
  try {
    const { data: documentos, error } = await supabase
      .from("upload_Documentos")
      .select("*")
      .order("data_upload", { ascending: false });

    if (error) {
      console.error("Erro ao buscar documentos no Supabase:", error);
      return res.status(500).json({
        error: "Erro ao buscar a lista de documentos.",
      });
    }
    console.log(documentos);
    res.status(200).json(documentos);
  } catch (error) {
    console.error("Erro ao listar publicações:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// n8n CHAMA AQUI PARA FINALIZAR

router.post("/n8n/complete", async (req, res) => {
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
    //******************
    if (!prazo.data_inicio || !prazo.dias || prazo.dias <= 0) {
      console.warn(
        `[n8n/complete] Prazo ${prazo.id} não possui data_inicio ou dias. Pulando cálculo.`
      );
      // Mesmo sem prazo, o processamento terminou.
    } else {
      // 2. CALCULAR A DATA LIMITE (Aqui está a sua lógica de feriados)
      console.log(
        `[n8n/complete] Calculando data limite... Início: ${prazo.data_inicio}, Dias: ${prazo.dias}`
      );

      //************/

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
          data_fim: dataLimiteFormatada, // Atualiza ambos
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

//Modal (Sem alterações)
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

export default router;
