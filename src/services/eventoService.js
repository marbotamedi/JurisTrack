import { notifyN8NWebhook } from "../utils/utils.js"; // Supondo que você use o N8N para a IA
import { registrarLog } from "./logService.js";

/**
 * Função central que recebe qualquer evento do sistema
 * @param {string} tipoEvento - Ex: 'UPLOAD_REALIZADO', 'ANDAMENTO_NOVO'
 * @param {object} dados - Dados relacionados (id do upload, id do processo)
 */
export const despacharEvento = async (tipoEvento, dados) => {
  // 1. Auditoria: Registra que o evento ocorreu
  await registrarLog("EVENTO_DISPARADO", `Evento: ${tipoEvento}`, dados);

  try {
    // 2. Roteamento: Decide o que fazer com base no tipo
    switch (tipoEvento) {
      case "UPLOAD_REALIZADO":
        //Lógica: Se subiu arquivo, chama a IA do N8N para ler
        console.log(
          `[EVENTO] Upload ID ${dados.uploadId || dados.id}. Acionando N8N...`
        );

        // CORREÇÃO: Chamada da função correta que está no utils.js
        // O uploadService passa { uploadId: ... }, mas a função espera o ID direto.
        // Vamos garantir que passamos o valor correto.
        const idParaN8N = dados.uploadId || dados.id;

        await notifyN8NWebhook(idParaN8N);
        break;

      case "NOVO_ANDAMENTO":
        // Lógica: Se saiu andamento, verifica se precisa gerar petição
        console.log("Verificando prazos para este andamento...");
        // Ex: if (dados.texto.includes("intimação")) { gerarSugestaoPeticao(...) }
        break;

      default:
        console.warn(`Nenhuma ação configurada para o evento: ${tipoEvento}`);
    }
  } catch (error) {
    await registrarLog("ERRO_EVENTO", `Falha ao processar ${tipoEvento}`, {
      erro: error.message,
    });
  }
};
