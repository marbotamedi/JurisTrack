import supabase from "../config/supabase.js";
import { generateSafeFilename, getCurrentSaoPauloTimestamp, notifyN8NWebhook } from "../utils/utils.js";
import { despacharEvento } from "./eventoService.js";

const Bucket_Name = "teste";

export const uploadFileToStorage = async (file) => {
  const fileName = generateSafeFilename(file.originalname);
  const filePath = `${fileName}`;

  // 1. Upload Storage
  const { error } = await supabase.storage
    .from(Bucket_Name)
    .upload(filePath, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (error) throw error; // Lança erro pro controller pegar

  // 2. Get URL
  const { data: publicUrlData } = supabase.storage
    .from(Bucket_Name)
    .getPublicUrl(filePath);

  // 3. Insert DB
  const localDateString = getCurrentSaoPauloTimestamp();
  const documentData = {
    nome_arquivo: fileName,
    url_publica: publicUrlData.publicUrl,
    data_upload: localDateString,
    status: "pendente",
  };

  const { data: insertData, error: insertError } = await supabase
    .from("upload_Documentos")
    .insert([documentData])
    .select();

  if (insertError) throw insertError;

  // 4. Webhook
  if (insertData && insertData.length > 0) {
    // O motor cuida do resto (logs e chamar N8N)
    despacharEvento("UPLOAD_REALIZADO", { uploadId: insertData[0].id });
  }

  return { fileName, publicUrl: publicUrlData.publicUrl };
};

export const listAllDocuments = async () => {
  const { data, error } = await supabase
    .from("upload_Documentos")
    .select("*")
    .order("data_upload", { ascending: false });

  if (error) throw error;
  return data;
};