import supabase from "../config/supabase.js";

/**
 * Busca o resultado do processamento baseado no nome do arquivo.
 * Realiza buscas em cascata (Upload -> Publicacoes -> Processo/Prazo/Andamento).
 */
export const getProcessingResult = async (fileName) => {
  // 1. Achar o uploadId a partir do nome_arquivo
  const { data: uploadDoc, error: uploadError } = await supabase
    .from("upload_Documentos")
    .select("id")
    .eq("nome_arquivo", fileName)
    .single();

  if (uploadError || !uploadDoc) {
    throw new Error("Documento de upload não encontrado.");
  }

  const uploadId = uploadDoc.id;

  // 2. Buscar as Publicações ligadas a esse uploadId
  const { data: publicacoes, error: pubError } = await supabase
    .from("Publicacao")
    .select("id, data_publicacao, processoId")
    .eq("uploadId", uploadId);

  if (pubError) {
    throw new Error(`Erro ao buscar publicações: ${pubError.message}`);
  }

  if (!publicacoes || publicacoes.length === 0) {
    return []; // Retorna array vazio se não achar nada, controller decide se é erro 404 ou apenas vazio
  }

  // 3. Para cada publicação, buscar seus dados relacionados
  const resultadosCalculados = [];

  for (const pub of publicacoes) {
    // Busca o Processo
    const { data: processo } = await supabase
      .from("Processos")
      .select("numero")
      .eq("id", pub.processoId)
      .single();

    // Busca o Prazo
    const { data: prazo } = await supabase
      .from("Prazo")
      .select("dias, data_limite")
      .eq("publicacaoId", pub.id)
      .single();

    // Busca o Andamento mais recente
    const { data: andamento } = await supabase
      .from("Andamento")
      .select("data_evento")
      .eq("publicacaoId", pub.id)
      .order("data_evento", { ascending: false })
      .limit(1)
      .single();

    // Monta o objeto final
    resultadosCalculados.push({
      publicacaoId: pub.id,
      numero_processo: processo?.numero || "N/A",
      nova_movimentação: andamento?.data_evento || null,
      data_publicacao: pub.data_publicacao,
      prazo_entrega: prazo?.dias || 0,
      data_vencimento_calculada: prazo?.data_limite || null,
    });
  }

  return resultadosCalculados;
};

/**
 * Busca o histórico de publicações de um processo pelo número.
 */
export const getProcessHistory = async (numeroProcesso) => {
  // 1. Achar o ID do processo
  const { data: processo, error: processoError } = await supabase
    .from("Processos")
    .select("id")
    .eq("numero", numeroProcesso)
    .single();

  if (processoError || !processo) {
    throw new Error("Processo não encontrado.");
  }

  // 2. Buscar todas as publicações
  const { data: publicacoes, error: pubError } = await supabase
    .from("Publicacao")
    .select("data_publicacao, texto_integral")
    .eq("processoId", processo.id)
    .order("data_publicacao", { ascending: false });

  if (pubError) throw pubError;

  return publicacoes;
};

/**
 * Busca todos os dados consolidados de uma publicação (para gerar a petição).
 * Realiza o "Flattening" (achatamento) dos dados aninhados.
 */
export const getProcessFullData = async (pubId) => {
  const { data: publicacao, error } = await supabase
    .from("Publicacao")
    .select(
      `
      data_publicacao,
      texto_integral,
      Processos ( numero ), 
      Prazo ( dias, data_inicio, data_limite ),
      Andamento ( descricao, data_evento, TipoAndamento ( descricao ) )
    `
    )
    .eq("id", pubId)
    .order("data_evento", { foreignTable: "Andamento", ascending: false })
    .single();

  if (error) throw error;
  if (!publicacao) return null;

  // Lógica de Achatamento (Flattening)
  const ultimoAndamento = publicacao.Andamento?.[0] || {};
  const tipoAndamento = ultimoAndamento.TipoAndamento || {};

  const flatData = {
    data_publicacao: publicacao.data_publicacao,
    texto_integral_publicacao: publicacao.texto_integral,
    numero_processo: publicacao.Processos?.numero || null,
    prazo_dias: publicacao.Prazo?.[0]?.dias || null,
    prazo_data_inicio: publicacao.Prazo?.[0]?.data_inicio || null,
    prazo_data_limite: publicacao.Prazo?.[0]?.data_limite || null,
    ultimo_andamento_desc: ultimoAndamento.descricao || null,
    ultimo_andamento_data: ultimoAndamento.data_evento || null,
    ultimo_andamento_tipo: tipoAndamento.descricao || null,
  };

  // Remove chaves nulas
  Object.keys(flatData).forEach((key) => {
    if (flatData[key] === null) {
      delete flatData[key];
    }
  });

  return flatData;
};