import supabase from "../config/supabase.js";
import {
  generateSafeFilename,
  getCurrentSaoPauloTimestamp,
  notifyN8NWebhook,
} from "../utils/utils.js";
import { injectTenant, withTenantFilter } from "../repositories/tenantScope.js";
import { ValidationError } from "../utils/authErrors.js";
import { logError, logInfo, logWarn } from "../utils/logger.js";

const Bucket_Name = "teste";

export const uploadFileToStorage = async (
  file,
  numProcesso,
  processoId,
  tenantId
) => {
  if (!tenantId) {
    throw new ValidationError(
      "tenantId é obrigatório para realizar upload com segregação."
    );
  }
  const safeName = generateSafeFilename(file.originalname);
  
  // LÓGICA DE PASTA: Cria o caminho "NUMERO/arquivo.pdf"
  let filePath = safeName;
  if (numProcesso && numProcesso.trim() !== "" && numProcesso !== "undefined") {
      const pastaSegura = numProcesso.trim().replace(/[^a-zA-Z0-9.-]/g, "_"); 
      filePath = `${pastaSegura}/${safeName}`;
  }
  // Prefixo por tenant para isolar arquivos
  filePath = `${tenantId}/${filePath}`;

  // 1. Upload Storage
  const { error: uploadError } = await supabase.storage
    .from(Bucket_Name)
    .upload(filePath, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (uploadError) throw uploadError;
  logInfo("upload.storage.success", "Upload salvo no storage", {
    tenantId,
    filePath,
    mimeType: file.mimetype,
    tamanho: file.size,
  });

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
    .insert([injectTenant(documentData, tenantId)])
    .select();

  if (insertError) throw insertError;
  logInfo("upload.db.insert_success", "Documento registrado com tenant", {
    tenantId,
    processoId,
    documentId: insertData?.[0]?.id,
    fileName: safeName,
  });

  // Webhook N8N (Opcional, mantido)
  if (insertData && insertData.length > 0) {
    notifyN8NWebhook(insertData[0].id, tenantId);
  }

  return { fileName: safeName, publicUrl: publicUrlData.publicUrl };
};


// --- FUNÇÃO ATUALIZADA: DELETAR DO BANCO E DO STORAGE ---
export const deleteDocument = async (id, tenantId) => {
  // 1. Busca os dados do arquivo no banco para pegar a URL
  const { data: doc, error: fetchError } = await withTenantFilter(
    "upload_Documentos",
    tenantId
  )
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!doc) {
    throw new Error("Documento não encontrado para este tenant.");
  }

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

        logInfo("upload.storage.delete_attempt", "Tentando deletar arquivo do storage", {
          tenantId,
          storagePath,
          documentId: id,
        });

        const { error: storageError } = await supabase.storage
          .from(Bucket_Name)
          .remove([storagePath]);

        if (storageError) {
          logWarn("upload.storage.delete_failed", "Erro ao deletar arquivo do storage", {
            tenantId,
            documentId: id,
            storagePath,
            error: storageError,
          });
          // Opcional: Se quiser impedir a exclusão do banco caso falhe no storage, lance o erro aqui.
          // throw storageError; 
        }
      }
    } catch (err) {
      logError("upload.storage.delete_path_error", "Erro ao processar caminho do arquivo", {
        tenantId,
        documentId: id,
        error: err,
      });
    }
  }

  // 3. Finalmente, deleta o registro do Banco de Dados
  const { error: deleteError } = await withTenantFilter(
    "upload_Documentos",
    tenantId
  )
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
  logInfo("upload.db.delete_success", "Documento excluído com sucesso", {
    tenantId,
    documentId: id,
  });

  return true;
};


// (Mantenha as funções listDocumentsByProcess e listAllDocuments como estavam)
export const listDocumentsByProcess = async (processoId, tenantId) => {
    const { data, error } = await withTenantFilter(
      "upload_Documentos",
      tenantId
    )
      .select("*")
      .eq("processo_id", processoId)
      .order("data_upload", { ascending: false });
  
    if (error) throw error;
    return data;
  };

export const listAllDocuments = async (tenantId) => {
  const { data, error } = await withTenantFilter(
    "upload_Documentos",
    tenantId
  )
    .select("*")
    .order("data_upload", { ascending: false });

  if (error) throw error;
  return data;
};