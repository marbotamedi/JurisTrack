import supabase from "../config/supabase.js";
import { generateSafeFilename, getCurrentSaoPauloTimestamp, notifyN8NWebhook } from "../utils/utils.js";

const Bucket_Name = "teste";

export const uploadFileToStorage = async (file, numProcesso, processoId) => {
  const safeName = generateSafeFilename(file.originalname);
  
  // LÓGICA DE PASTA: Cria o caminho "NUMERO/arquivo.pdf"
  let filePath = safeName;
  if (numProcesso && numProcesso.trim() !== "" && numProcesso !== "undefined") {
      const pastaSegura = numProcesso.trim().replace(/[^a-zA-Z0-9.-]/g, "_"); 
      filePath = `${pastaSegura}/${safeName}`;
  }

  // 1. Upload Storage
  const { error: uploadError } = await supabase.storage
    .from(Bucket_Name)
    .upload(filePath, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (uploadError) throw uploadError;

  // 2. Get URL Pública
  const { data: publicUrlData } = supabase.storage
    .from(Bucket_Name)
    .getPublicUrl(filePath);

  // 3. Insert DB
  const localDateString = getCurrentSaoPauloTimestamp();
  
  const documentData = {
    nome_arquivo: safeName,
    url_publica: publicUrlData.publicUrl,
    data_upload: localDateString,
    // REQUISITO: Status fixo para documentos da ficha
    status: "doc_processo", 
    processo_id: processoId,
    // REQUISITO: Salvar tipo e tamanho
    tipo: file.mimetype, 
    tamanho: file.size   
  };

  const { data: insertData, error: insertError } = await supabase
    .from("upload_Documentos")
    .insert([documentData])
    .select();

  if (insertError) throw insertError;

  // Webhook N8N (Opcional, mantido)
  if (insertData && insertData.length > 0) {
    notifyN8NWebhook(insertData[0].id);
  }

  return { fileName: safeName, publicUrl: publicUrlData.publicUrl };
};


// --- FUNÇÃO ATUALIZADA: DELETAR DO BANCO E DO STORAGE ---
export const deleteDocument = async (id) => {
  // 1. Busca os dados do arquivo no banco para pegar a URL
  const { data: doc, error: fetchError } = await supabase
    .from("upload_Documentos")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // 2. Tenta deletar do Storage (se tiver URL)
  if (doc.url_publica) {
    try {
      // A URL pública é algo como: .../storage/v1/object/public/teste/1234_2024/arquivo.pdf
      // Precisamos extrair apenas: 1234_2024/arquivo.pdf
      
      // Divide a URL usando o nome do bucket como separador
      const bucketUrlPart = `/${Bucket_Name}/`;
      const urlParts = doc.url_publica.split(bucketUrlPart);

      if (urlParts.length > 1) {
        // Pega a parte final (o caminho) e decodifica (ex: remove %20)
        const storagePath = decodeURIComponent(urlParts[1]);

        console.log(`Tentando deletar do storage: ${storagePath}`);

        const { error: storageError } = await supabase.storage
          .from(Bucket_Name)
          .remove([storagePath]);

        if (storageError) {
          console.error("Erro ao deletar arquivo do Storage:", storageError);
          // Opcional: Se quiser impedir a exclusão do banco caso falhe no storage, lance o erro aqui.
          // throw storageError; 
        }
      }
    } catch (err) {
      console.error("Erro ao processar caminho do arquivo:", err);
    }
  }

  // 3. Finalmente, deleta o registro do Banco de Dados
  const { error: deleteError } = await supabase
    .from("upload_Documentos")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;

  return true;
};


// (Mantenha as funções listDocumentsByProcess e listAllDocuments como estavam)
export const listDocumentsByProcess = async (processoId) => {
    const { data, error } = await supabase
      .from("upload_Documentos")
      .select("*")
      .eq("processo_id", processoId)
      .order("data_upload", { ascending: false });
  
    if (error) throw error;
    return data;
  };

export const listAllDocuments = async () => {
  const { data, error } = await supabase
    .from("upload_Documentos")
    .select("*")
    .order("data_upload", { ascending: false });

  if (error) throw error;
  return data;
};