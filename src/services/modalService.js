import supabase from "../config/supabase.js";
import { withTenantFilter } from "../repositories/tenantScope.js";

/**
 * Busca o resultado do processamento baseado no nome do arquivo.
 */
export const getProcessingResult = async (fileName, tenantId) => {
  const { data: uploadDoc, error: uploadError } = await withTenantFilter(
    "upload_Documentos",
    tenantId
  )
    .select("id")
    .eq("nome_arquivo", fileName)
    .maybeSingle();

  if (uploadError || !uploadDoc) {
    throw new Error("Documento de upload não encontrado.");
  }

  const uploadId = uploadDoc.id;

  const { data: publicacoes, error: pubError } = await withTenantFilter(
    "Publicacao",
    tenantId
  )
    .select("id, data_publicacao, processoid")
    .eq("uploadid", uploadId);

  if (pubError) {
    throw new Error(`Erro ao buscar publicações: ${pubError.message}`);
  }

  if (!publicacoes || publicacoes.length === 0) {
    return [];
  }

  const resultadosCalculados = [];

  for (const pub of publicacoes) {
    const { data: processo } = await withTenantFilter(
      "processos",
      tenantId
    )
      .select("numprocesso")
      .eq("idprocesso", pub.processoid)
      .maybeSingle();

    const { data: prazo } = await withTenantFilter("Prazo", tenantId)
      .select("dias, data_limite")
      .eq("publicacaoid", pub.id)
      .maybeSingle();

    const { data: andamento } = await withTenantFilter("Andamento", tenantId)
      .select("data_evento")
      .eq("publicacaoid", pub.id)
      .order("data_evento", { ascending: false })
      .limit(1)
      .maybeSingle();

    resultadosCalculados.push({
      publicacaoId: pub.id,
      numero_processo: processo?.numprocesso || "N/A",
      nova_movimentação: andamento?.data_evento || null,
      data_publicacao: pub.data_publicacao,
      prazo_entrega: prazo?.dias || 0,
      data_vencimento_calculada: prazo?.data_limite || null,
    });
  }

  return resultadosCalculados;
};

export const getProcessHistory = async (numeroProcesso, tenantId) => {
  const { data: processo, error: processoError } = await withTenantFilter(
    "processos",
    tenantId
  )
    .select("idprocesso")
    .eq("numprocesso", numeroProcesso)
    .maybeSingle();

  if (processoError || !processo) {
    throw new Error("Processo não encontrado.");
  }

  const { data: publicacoes, error: pubError } = await withTenantFilter(
    "Publicacao",
    tenantId
  )
    .select("data_publicacao, texto_integral")
    .eq("processoid", processo.idprocesso)
    .order("data_publicacao", { ascending: false });

  if (pubError) throw pubError;

  return publicacoes;
};

/**
 * Busca TODOS os dados consolidados para preenchimento de petição.
 * Realiza JOINs com Tabelas Auxiliares (Cidades, Varas, etc).
 */
export const getProcessFullData = async (pubId, tenantId) => {
  // Query principal com JOINs (!inner garante integridade, mas pode usar left join se dados forem opcionais)
  // Usaremos left joins implícitos aqui (sem !inner nas tabelas filhas) para evitar erro se faltar uma comarca
  const { data, error } = await withTenantFilter("Publicacao", tenantId)
    .select(
      `
      data_publicacao,
      texto_integral,
      processos!inner (
        numprocesso,
        pasta,
        datainicial,
        datasaida,
        obs,
        cidades ( descricao, estados (uf) ),
        comarcas ( descricao ),
        tribunais ( descricao ),
        varas ( descricao ),
        instancias ( descricao )
      ),
      Prazo ( dias, data_inicio, data_limite ),
      Andamento ( descricao, data_evento )
      
    `
    )
    .eq("id", pubId)
    .eq("processos.tenant_id", tenantId)
    .order("data_evento", { foreignTable: "Andamento", ascending: false })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Pegamos o último andamento (ordenado na query)
  const andamento = data.Andamento?.[0];
  const proc = data.processos;

  // Montagem do objeto "Flattened" (Achatado) para facilitar o Replace no Frontend
  // As chaves aqui DEVEM ser iguais às usadas nos {{Templates}}
  const result = {
    // --- Dados da Publicação ---
    data_publicacao: data.data_publicacao,
    texto_integral: data.texto_integral,

    // --- Dados do Processo ---
    NumProcesso: proc?.numprocesso,
    Pasta: proc?.pasta,
    DataInicial: proc?.datainicial,
    DataSaida: proc?.datasaida,
    Obs: proc?.obs,

    //---- Cliente ----//
    /*Cliente: proc.sj_papelcliente?.descricao,
    Oposto: proc?.sj_papelcliente?.Oposto,*/

    // --- Dados de Localização e Juízo (Extraídos dos Joins) ---
    // Verifica se os objetos existem antes de acessar .descricao
    Cidade: proc?.cidades?.descricao,
    uf: proc?.cidades?.estados?.uf,
    Comarca: proc?.comarcas?.descricao,
    Tribunal: proc?.tribunais?.descricao,
    Vara: proc?.varas?.descricao,
    Instancia: proc?.instancias?.descricao,

    // --- Prazos ---
    dias: data.Prazo?.[0]?.dias,
    data_limite: data.Prazo?.[0]?.data_limite,

    // --- Andamento ---
    Ultimo_Andamento: andamento?.descricao,
    Data_Andamento: andamento?.data_evento,

    DATA_ATUAL: new Date().toLocaleDateString("pt-BR"),
  };

  return result;
};