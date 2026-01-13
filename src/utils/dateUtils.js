import moment from 'moment-timezone';
import supabase from "../config/supabase.js";

// O Cache agora pode armazenar o SET de feriados ou a PROMISE de que estão sendo buscados
const holidayCache = new Map();

const BRASIL_API_URL = "https://brasilapi.com.br/api/feriados/v1";

/**
 * FUNÇÃO INTERNA: Busca na API e salva no Supabase.
 * @param {number} year - O ano para buscar e salvar.
 * @returns {Promise<Set<string>>} - Um Set com as datas dos feriados nacionais.
 */
async function fetchAndStoreHolidays(year) {
  console.log(
    `[dateUtils] Feriados para ${year} não encontrados no DB. Buscando na BrasilAPI...`
  );

  try {
    const response = await fetch(`${BRASIL_API_URL}/${year}`);
    if (!response.ok) {
      throw new Error(`Erro na API de feriados: ${response.statusText}`);
    }

    const holidays = await response.json();
    const nationalHolidays = holidays.filter(
      (feriado) => feriado.type === "national"
    );

    const records = nationalHolidays.map((feriado) => ({
      data: feriado.date,
      descricao: feriado.name,
      tipo: feriado.type,
    }));

    if (records.length > 0) {
      console.log(
        `[dateUtils] Inserindo ${records.length} feriados nacionais de ${year} no Supabase...`
      );

      const { error } = await supabase
        .from("Feriado")
        .upsert(records, { onConflict: "data" }); // Isso agora vai funcionar (após o Passo 1)

      if (error) {
        // Loga o erro mas não para a execução
        console.error(
          "[dateUtils] Erro ao salvar feriados no Supabase:",
          error
        );
      }
    }

    return new Set(nationalHolidays.map((feriado) => feriado.date));
  } catch (error) {
    console.error(
      `[dateUtils] Falha total ao buscar e salvar feriados para ${year}:`,
      error.message
    );
    return new Set();
  }
}

/**
 * @param {number} year - O ano para buscar os feriados.
 * @returns {Promise<Set<string>>} - Um Set com as datas dos feriados.
 */
function getHolidays(year) {
  // Verifica o cache
  if (holidayCache.has(year)) {
    return holidayCache.get(year);
  }

  //  Se não está no cache, cria a Promise de busca
  const holidayPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("Feriado")
        .select("data")
        .in("tipo", ["national", "manual"])
        .gte("data", `${year}-01-01`)
        .lte("data", `${year}-12-31`);

      if (error) {
        console.error(
          `[dateUtils] Erro ao consultar feriados no DB para ${year}:`,
          error.message
        );
        // Tenta buscar na API como fallback
        return await fetchAndStoreHolidays(year);
      }

      if (data && data.length > 0) {
        // Encontrou no DB
        const nationalHolidays = new Set(data.map((feriado) => feriado.data));
        holidayCache.set(year, nationalHolidays);
        return nationalHolidays;
      }

      //Não encontrou no DB, busca na API
      else {
        const holidaysFromAPI = await fetchAndStoreHolidays(year);
        holidayCache.set(year, holidaysFromAPI);
        return holidaysFromAPI;
      }
    } catch (error) {
      console.error(
        `[dateUtils] Falha crítica ao obter feriados para ${year}.`,
        error.message
      );

      holidayCache.delete(year);
      return new Set();
    }
  })(); // IIFE (Função auto-executável)

  holidayCache.set(year, holidayPromise);

  return holidayPromise;
}

/**
 * Adiciona dias úteis (Função NÃO MODIFICADA, apenas chama a nova getHolidays)
 */
export async function addBusinessDays(
  startDate,
  daysToAdd,
  timezone = "America/Sao_Paulo"
) {
  //let currentDate = moment(startDate).tz(timezone); // Para usar desse jeito, mudar as colunas data_inicio , data_fim e data_limite para tipo "DATE"
  // Pega apenas a parte da data (ex: "2025-10-24") e a força no fuso de SP
  let currentDate = moment.tz(startDate.split("T")[0], "YYYY-MM-DD", timezone);
  let daysAdded = 0;

  if (isNaN(daysToAdd) || daysToAdd <= 0) {
    console.warn("addBusinessDays: 'daysToAdd' deve ser um número positivo.");
    return currentDate;
  }

  let currentYear = currentDate.year();
  let holidaysForYear = await getHolidays(currentYear); // Chama a nova função

  while (daysAdded < daysToAdd) {
    currentDate.add(1, "day");

    if (currentDate.year() !== currentYear) {
      currentYear = currentDate.year();
      holidaysForYear = await getHolidays(currentYear); // Chama a nova função
      console.log(
        `[dateUtils] Ano mudou. Carregando feriados para: ${currentYear}`
      );
    }

    const dayOfWeek = currentDate.day();
    const dateString = currentDate.format("YYYY-MM-DD");

    if (
      dayOfWeek !== 0 &&
      dayOfWeek !== 6 &&
      !holidaysForYear.has(dateString)
    ) {
      daysAdded++;
    }
  }
  return currentDate;
}