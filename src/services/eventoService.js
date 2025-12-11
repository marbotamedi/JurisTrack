import * as n8nService from "./n8nService.js"; // Supondo que você use o N8N para a IA
import { registrarLog } from "./logService.js";

/**
 * Função central que recebe qualquer evento do sistema
 * @param {string} tipoEvento - Ex: 'UPLOAD_REALIZADO', 'ANDAMENTO_NOVO'
 * @param {object} dados - Dados relacionados (id do upload, id do processo)
 */
export const despacharEvento = async (tipoEvento, dados) => {
  
  // 1. Auditoria: Registra que o evento ocorreu
  await registrarLog('EVENTO_DISPARADO', `Evento: ${tipoEvento}`, dados);

  try {
    // 2. Roteamento: Decide o que fazer com base no tipo
    switch (tipoEvento) {
      
      case 'UPLOAD_REALIZADO':
        // Lógica: Se subiu arquivo, chama a IA do N8N para ler
        console.log("Iniciando processamento de IA via N8N...");
        // Aqui você pode chamar seu webhook do N8N
        await n8nService.chamarWebhook(dados.id); 
        break;

      case 'NOVO_ANDAMENTO':
        // Lógica: Se saiu andamento, verifica se precisa gerar petição
        console.log("Verificando prazos para este andamento...");
        // Ex: if (dados.texto.includes("intimação")) { gerarSugestaoPeticao(...) }
        break;

      default:
        console.warn(`Nenhuma ação configurada para o evento: ${tipoEvento}`);
    }
  } catch (error) {
    await registrarLog('ERRO_EVENTO', `Falha ao processar ${tipoEvento}`, { erro: error.message });
  }
};