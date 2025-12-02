import supabase from "../config/supabase.js";

/**
 * Busca o resultado do processamento baseado no nome do arquivo.
 */
export const getProcessingResult = async (fileName) => {
  const { data: uploadDoc, error: uploadError } = await supabase
    .from("upload_Documentos")
    .select("id")
    .eq("nome_arquivo", fileName)
    .single();

  if (uploadError || !uploadDoc) {
    throw new Error("Documento de upload não encontrado.");
  }

  const uploadId = uploadDoc.id;

  const { data: publicacoes, error: pubError } = await supabase
    .from("Publicacao")
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
    const { data: processo } = await supabase
      .from("processos")
      .select("numprocesso")
      .eq("idprocesso", pub.processoid)
      .single();

    const { data: prazo } = await supabase
      .from("Prazo")
      .select("dias, data_limite")
      .eq("publicacaoid", pub.id)
      .single();

    const { data: andamento } = await supabase
      .from("Andamento")
      .select("data_evento")
      .eq("publicacaoid", pub.id)
      .order("data_evento", { ascending: false })
      .limit(1)
      .single();

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

export const getProcessHistory = async (numeroProcesso) => {
  const { data: processo, error: processoError } = await supabase
    .from("processos")
    .select("idprocesso")
    .eq("numprocesso", numeroProcesso)
    .single();

  if (processoError || !processo) {
    throw new Error("Processo não encontrado.");
  }

  const { data: publicacoes, error: pubError } = await supabase
    .from("Publicacao")
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
export const getProcessFullData = async (pubId) => {
  // Query principal com JOINs (!inner garante integridade, mas pode usar left join se dados forem opcionais)
  // Usaremos left joins implícitos aqui (sem !inner nas tabelas filhas) para evitar erro se faltar uma comarca
  const { data, error } = await supabase
    .from("Publicacao")
    .select(`
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
    `)
    .eq("id", pubId)
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

    // --- Dados de Localização e Juízo (Extraídos dos Joins) ---
    // Verifica se os objetos existem antes de acessar .descricao
    Cidade_Descricao: proc?.cidades?.descricao,
    uf: proc?.cidades?.estado?.uf,
    Comarca_Descricao: proc?.comarcas?.descricao,
    Tribunal_Descricao: proc?.tribunais?.descricao,
    Vara_Descricao: proc?.varas?.descricao,
    Instancia_Descricao: proc?.instancias?.descricao,

    // --- Prazos ---
    dias: data.Prazo?.[0]?.dias,
    data_limite: data.Prazo?.[0]?.data_limite,

    // --- Andamento ---
    Ultimo_Andamento: andamento?.descricao,
    Data_Andamento: andamento?.data_evento
  };

  return result;
};