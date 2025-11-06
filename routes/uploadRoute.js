import express from "express";
import supabase from "../config/supabase.js";
import { upload } from "../middlewares/multer.js";
import {
  generateSafeFilename,
  getCurrentSaoPauloTimestamp,
  notifyN8NWebhook,
} from "../utils/utils.js";

//Pasta Supabase Storage
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

//   ROTA PRINCIPAL: (LISTAGEM DA TABELA)

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


export default router;
