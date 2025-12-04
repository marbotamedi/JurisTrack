/* Define as opções de formatação padrão para pt-BR (São Paulo) - COMPLETA.*/

const optionsCompleta = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  /*timeZone: "America/Sao_Paulo",*/
  timeZone: "UTC",
};


/* Define  formatação padrão para pt-BR (São Paulo) - SÓ DATA.*/
 
const optionsSoData = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Sao_Paulo", // Manter o fuso evita que a data "vire" (ex: dia 31 vire dia 1)
};

const optionsSoDataUTC = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC", 
};

 /* Função base interna para formatar, evitando repetição de código.*/
 
function _formatarData(dataInput, options) {
  // Retorna um aviso se a data for nula ou vazia
  if (!dataInput) {
    return "Data não fornecida";
  }

  const dateObj = new Date(dataInput);

  // Verifica se a data resultante é válida
  if (isNaN(dateObj.getTime())) {
    console.warn("Tentativa de formatar data inválida:", dataInput);
    return "Data inválida";
  }

  // Retorna a data formatada
  return dateObj.toLocaleString("pt-BR", options);
}



/** "dd/mm/aaaa, hh:mm:ss" no fuso de São Paulo.
 * @param {string | Date} dataInput - A data a ser formatada.
 * @returns {string} - A data formatada ou uma mensagem de erro se a data for inválida.
 */
export function formatarDataBR(dataInput) {
  return _formatarData(dataInput, optionsCompleta);
}

/**
 * "dd/mm/aaaa" (SOMENTE DATA) no fuso de São Paulo.
 * @param {string | Date} dataInput - A data a ser formatada.
 * @returns {string} - A data formatada ou uma mensagem de erro se a data for inválida.
 */
export function formatarDataBR_SoData(dataInput) {
    return _formatarData(dataInput, optionsSoData);
}

/** "dd/mm/aaaa" (SOMENTE DATA) no fuso UTC.

 * @param {string | Date} dataInput - A data a ser formatada.
 * @returns {string} - A data formatada ou uma mensagem de erro se a data for inválida.
 */
export function formatarDataBR_SoData_UTC(dataInput) {
    return _formatarData(dataInput, optionsSoDataUTC);
}
