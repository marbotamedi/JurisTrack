import supabase from "../config/supabase.js";

export const listarProcessos = async (filtros) => {
  let query = supabase
  .from("processos")
  .select(`
    idprocesso,
    numprocesso,
    assunto,
    situacao:situacoes ( descricao ),
    cidades ( descricao, estados ( uf ) ),
    comarcas ( descricao ),
    autor:pessoas!fk_processos_autor ( nome ),
    reu:pessoas!fk_processos_reu ( nome )
  `)
  .is("deleted_at", null);

  if (filtros.busca) {
    query = query.or(`numprocesso.ilike.%${filtros.busca}%,assunto.ilike.%${filtros.busca}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const obterProcessoCompleto = async (id) => {
  const { data, error } = await supabase
    .from("processos")
    .select(`
      *,
      cidades ( idcidade, descricao, idestado ),
      comarcas ( idcomarca, descricao ),
      varas ( idvara, descricao ),
      tipo_acao:tipos_acao ( idtipoacao, descricao ), 
      rito:ritos ( idrito, descricao ),
      esfera:esferas ( idesfera, descricao ),
      fase:fases ( idfase, descricao ),
      situacao:situacoes ( idsituacao, descricao ),
      probabilidade:probabilidades ( idprobabilidade, descricao ), 
      moeda:moedas ( idmoeda, descricao ),
      autor:pessoas!fk_processos_autor ( idpessoa, nome, cpf_cnpj ),
      reu:pessoas!fk_processos_reu ( idpessoa, nome, cpf_cnpj ),
      advogado:pessoas!fk_processos_advogado ( idpessoa, nome ),

      Publicacao (
        id,
        texto_integral,
        data_publicacao,
        Prazo ( * ),
        Andamento ( * ),
        Historico_Peticoes ( * )
      ),
      
      Andamento (
        *,
        responsavel:pessoas!Andamento_responsavelId_fkey ( nome )
      )
    `)
    .eq("idprocesso", id)
    .single();
      console.log(data);
  if (error) throw error;
  return data;

  
};

export const criarProcesso = async (dados) => {
  const { data, error } = await supabase.from("processos").insert([dados]).select();
  if (error) throw error;
  return data;
};

export const atualizarProcesso = async (id, dados) => {
  const { data, error } = await supabase.from("processos").update(dados).eq("idprocesso", id).select();
  if (error) throw error;
  return data;
};

export const excluirProcesso = async (id) => {
  const { error } = await supabase
    .from("processos")
    .update({ deleted_at: new Date() }) 
    .eq("idprocesso", id);
  if (error) throw error;
  return true;
};

/**
 * Busca dados do processo e formata para preenchimento de templates (Placeholders)
 */
export const obterContextoParaModelo = async (idProcesso) => {
  // Busca os dados fazendo os Joins com as tabelas auxiliares
  const { data, error } = await supabase
    .from("processos")
    .select(`
      numprocesso,
      pasta,
      datainicial,
      datasaida,
      obs,
      valor_causa,
      classe_processual,
      assunto,
      cidades ( descricao, estados ( uf ) ),
      comarcas ( descricao ),
      tribunais ( descricao ),
      varas ( descricao ),
      instancias ( descricao ),
      autor:pessoas!fk_processos_autor ( nome, cpf_cnpj ),
      reu:pessoas!fk_processos_reu ( nome, cpf_cnpj )
      advogado:pessoas!fk_processos_advogado ( idpessoa, nome ),
    `)
    .eq("idprocesso", idProcesso)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Formata o objeto para ser compatível com os Placeholders do Frontend
  // As chaves aqui (ex: NumProcesso, Cidade, Autor) são as que você usa no modelo {{...}}
  const contexto = {
    // Dados do Processo
    NumProcesso: data.numprocesso || "S/N",
    Pasta: data.pasta || "",
    DataInicial: data.datainicial ? new Date(data.datainicial).toLocaleDateString("pt-BR") : "",
    DataSaida: data.datasaida ? new Date(data.datasaida).toLocaleDateString("pt-BR") : "",
    Obs: data.obs || "",
    ValorCausa: data.valor_causa ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor_causa) : "",
    Classe: data.classe_processual || "",
    Assunto: data.assunto || "",

    // Locais (usando ?. para evitar erro se estiver vazio)
    Cidade: data.cidades?.descricao || "",
    uf: data.cidades?.estados?.uf || "",
    Comarca: data.comarcas?.descricao || "",
    Tribunal: data.tribunais?.descricao || "",
    Vara: data.varas?.descricao || "",
    Instancia: data.instancias?.descricao || "",

    // Partes
    NOME_AUTOR: data.autor?.nome || "",
    Autor_CPF: data.autor?.cpf_cnpj || "",
    NOME_REU: data.reu?.nome || "",
    Reu_CPF: data.reu?.cpf_cnpj || "",
    NOME_ADVOGADO: data.advogado?.nome || "",

    // Datas genéricas
    DATA_ATUAL: new Date().toLocaleDateString("pt-BR"),
  };

  return contexto;
};