import supabase from "../config/supabase.js";

export const listarProcessos = async (filtros) => {
  let query = supabase
    .from("processos")
    .select(`
      idprocesso,
      numprocesso,
      pasta,
      descricao,
      cidades ( descricao ),
      comarcas ( descricao )
    `);

  if (filtros.busca) {
    query = query.or(`numprocesso.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`);
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
      cidades ( idcidade, descricao, idestado, estados(uf) ),
      comarcas ( idcomarca, descricao ),
      tribunais ( idtribunal, descricao ),
      varas ( idvara, descricao ),
      instancias ( idinstancia, descricao ),
      decisoes ( iddecisao, descricao ),
      Publicacao (
        id,
        data_publicacao,
        texto_integral,
        upload_Documentos ( id, nome_arquivo, url_publica ),
        Andamento ( id, descricao, data_evento ),
        Prazo ( id, descricao, dias, data_limite )
      )
    `)
    .eq("idprocesso", id)
    .single();

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
  const { error } = await supabase.from("processos").delete().eq("idprocesso", id);
  if (error) throw error;
  return true;
};