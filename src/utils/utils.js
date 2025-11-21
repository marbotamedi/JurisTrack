import path from 'path';
import moment from 'moment-timezone';

// URL Webhook N8N
const N8N_WEBHOOK_URL = "https://agendamentoai-n8n.mapkkt.easypanel.host/webhook/processar/";


/**
 * Gera um nome de arquivo seguro, normalizado, minúsculo e hifenizado.
 * @param {string} originalname - O nome original do arquivo (req.file.originalname).
 * @returns {string} - O nome de arquivo seguro com extensão (ex: 'meu-arquivo.pdf').
 */
export function generateSafeFilename(originalname) {
  const fileExtension = path.extname(originalname);
  const baseName = path.basename(originalname, fileExtension);

  // 1. Normaliza (remove acentos)
  const normalizedBaseName = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Substitui caracteres não alfanuméricos e espaços por hífens
  const safeBaseName = normalizedBaseName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove caracteres especiais
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"); // Substitui espaços por hífens

  // 3. Retorna o nome final
  return `${safeBaseName}${fileExtension}`;
}

/**
 * Retorna o timestamp atual no fuso de São Paulo.
 * @returns {string} - Data formatada (ex: "YYYY-MM-DD HH:mm:ss").
 */
export function getCurrentSaoPauloTimestamp() {
  const timeZone = "America/Sao_Paulo";
  const nowSaoPaulo = moment().tz(timeZone);
  return nowSaoPaulo.format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Aciona o webhook do N8N de forma assíncrona para notificar o novo upload.
 * Não bloqueia a resposta ao usuário.
 * @param {string|number} uploadId - O ID do registro inserido no banco.
 */
export async function notifyN8NWebhook(uploadId) {
  console.log(`[fileUtils] Acionando webhook para o ID: ${uploadId}`);
  try {
    // Note: Não usamos 'await' na chamada desta função no router
    // para que ela rode em background.
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: uploadId }),
    });

    if (webhookResponse.ok) {
      console.log("[fileUtils] Webhook do n8n acionado com sucesso!");
    } else {
      console.error(
        `[fileUtils] Falha ao acionar Webhook do n8n: Status ${webhookResponse.status}`
      );
    }
  } catch (webhookError) {
    console.error(
      "[fileUtils] Erro de rede ao tentar acionar o Webhook do n8n:",
      webhookError
    );
  }
}