import moment from 'moment-timezone';

// Cache para armazenar feriados por ano (Map<ano, Set<"YYYY-MM-DD">>)
// Isso evita que façamos chamadas repetidas à API para o mesmo ano.
const holidayCache = new Map();
const BRASIL_API_URL = "https://brasilapi.com.br/api/feriados/v1";

/**
 * Busca feriados nacionais de um ano específico da BrasilAPI e armazena em cache.
 * Filtra apenas feriados "national".
 * @param {number} year - O ano para buscar os feriados.
 * @returns {Promise<Set<string>>} - Um Set com as datas dos feriados (formato "YYYY-MM-DD").
 */
async function getHolidays(year) {
  // 1. Verifica o cache primeiro
  if (holidayCache.has(year)) {
    return holidayCache.get(year);
  }
  
  /*console.log(`[dateUtils] Buscando feriados nacionais para o ano: ${year}`);*/

  try {
    // 2. Busca na API (fetch é nativo no Node.js moderno)
    const response = await fetch(`${BRASIL_API_URL}/${year}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar feriados: ${response.status} ${response.statusText}`);
    }
    
    const holidays = await response.json();

    // 3. Filtra apenas feriados nacionais e extrai as datas
    const nationalHolidays = new Set(
      holidays
        .filter(feriado => feriado.type === 'national')
        .map(feriado => feriado.date) // Formato "YYYY-MM-DD"
    );

    // 4. Salva em cache e retorna
    holidayCache.set(year, nationalHolidays);
    return nationalHolidays;

  } catch (error) {
    console.error(`[dateUtils] Falha ao buscar feriados para ${year}.`, error.message);
    // Retorna um set vazio em caso de erro.
    // O cálculo de dias úteis continuará, mas considerando apenas fins de semana.
    return new Set();
  }
}

/**
 * Adiciona um número específico de dias úteis (segunda a sexta) a uma data,
 * desconsiderando fins de semana E feriados nacionais (via BrasilAPI).
 *
 * NOTA: Esta função agora é ASSÍNCRONA e deve ser chamada com 'await'.
 *
 * @param {string|Date|moment} startDate - A data inicial para o cálculo.
 * @param {number} daysToAdd - O número de dias úteis a serem adicionados.
 * @param {string} [timezone="America/Sao_Paulo"] - O fuso horário para garantir 
 * a consistência dos cálculos de dias.
 * @returns {Promise<moment.Moment>} - Um novo objeto moment com a data final calculada.
 */
async function addBusinessDays(startDate, daysToAdd, timezone = "America/Sao_Paulo") {
  // Garante que estamos trabalhando com um objeto moment no fuso correto
  let currentDate = moment(startDate).tz(timezone);
  let daysAdded = 0;

  // Validação simples da entrada
  if (isNaN(daysToAdd) || daysToAdd <= 0) {
    console.warn("addBusinessDays: 'daysToAdd' deve ser um número positivo.");
    return currentDate; // Retorna a data original se a entrada for inválida
  }

  // Busca os feriados para o ano inicial
  let currentYear = currentDate.year();
  let holidaysForYear = await getHolidays(currentYear);

  while (daysAdded < daysToAdd) {
    // Adiciona um dia de calendário
    currentDate.add(1, 'day');

    // Se o ano mudou durante o loop (ex: 28/12 + 5 dias),
    // precisamos buscar os feriados do novo ano.
    if (currentDate.year() !== currentYear) {
      currentYear = currentDate.year();
      holidaysForYear = await getHolidays(currentYear);
      console.log(`[dateUtils] Ano mudou. Buscando feriados para: ${currentYear}`);
    }

    // Pega o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const dayOfWeek = currentDate.day();
    const dateString = currentDate.format('YYYY-MM-DD');

    // Se NÃO for sábado (6) E NÃO for domingo (0) E NÃO for feriado
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaysForYear.has(dateString)) {
      daysAdded++;
    }
    // Se for fim de semana ou feriado, o loop continua sem incrementar 'daysAdded'.
  }

  return currentDate;
}


export {
  addBusinessDays
};