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
  
  if (error) {
    console.error("Erro ao listar processos:", error);
    throw error;
  }
  
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
      
      probabilidade:probabilidades ( idprobilidade, descricao ), 
      
      moeda:moedas ( idmoeda, descricao ),

      autor:pessoas!fk_processos_autor ( idpessoa, nome, cpf_cnpj ),
      reu:pessoas!fk_processos_reu ( idpessoa, nome, cpf_cnpj ),
      advogado:pessoas!fk_processos_advogado ( idpessoa, nome )
    `)
    .eq("idprocesso", id)
    .single();

  if (error) {
    console.error("Erro ao buscar ficha do processo:", error);
    throw error;
  }
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

// --- SOFT DELETE (Exclusão Lógica) ---
export const excluirProcesso = async (id) => {
  // Ao invés de .delete(), fazemos um update na data de exclusão
  const { error } = await supabase
    .from("processos")
    .update({ deleted_at: new Date() }) 
    .eq("idprocesso", id);

  if (error) throw error;
  return true;
};