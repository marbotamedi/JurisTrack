import express from 'express';
import path from 'path';
import supabase from "../config/supabase.js";
import { upload } from "../middlewares/multer.js";
import moment from "moment-timezone";

const Bucket_Name = "teste";
const router = express.Router();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const file = req.file;

    const fileExtension = path.extname(req.file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    // 1. Normaliza a string (remove acentuações como 'ã' -> 'a')
    const normalizedBaseName = baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    //2. Substitui caracteres não alfanuméricos e espaços por hífens (-)
    const safeBaseName = normalizedBaseName
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove caracteres especiais, exceto espaços
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"); // Substitui espaços por hífens

    // 3. Cria o nome final do arquivo
    /*const fileName = `${Date.now()}-${safeBaseName}${fileExtension}`;*/
    const fileName = `${safeBaseName}${fileExtension}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(Bucket_Name)
      .upload(filePath, file.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) {
      console.error("Erro ao fazer upload para o Supabase:", error);

      if (error.statusCode === "409") {
        return res.status(409).json({ error: "Arquivo em duplicidade." });
      }

      // 2. Trata qualquer outro erro como um erro interno
      return res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
    }

    const { data: publicUrlData } = supabase.storage
      .from(Bucket_Name)
      .getPublicUrl(filePath);

    // Formata a data para o fuso horário de São Paulo
    const timeZone = "America/Sao_Paulo";

    const nowSaoPaulo = moment().tz(timeZone);

    const localDateString = nowSaoPaulo.format("YYYY-MM-DD HH:mm:ss");

    // Dados para o banco de dados
    const documentData = {
      nome_arquivo: fileName,
      url_publica: publicUrlData.publicUrl,
      data_upload: localDateString,
      status: "pendente",
    };

    //Insere os dados na tabela
    const { error: insertError } = await supabase
      .from("upload_Documentos")
      .insert([documentData]);

    if (insertError) {
      console.error("Erro ao salvar os dados no Supabase:", insertError);
      return res.status(500).json({
        error: "Erro ao salvar informações do arquivo no banco de dados.",
      });
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

export default router;

