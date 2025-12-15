// Arquivo: src/services/processosService.js
import supabase from "../config/supabase.js";

export const listarProcessos = async (filtros) => {
  // CORREÇÃO: Tudo em minúsculo aqui dentro do select
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
    // CORREÇÃO: Filtros também em minúsculo
    query = query.or(`numprocesso.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const obterProcessoCompleto = async (id) => {
  // CORREÇÃO: Tudo em minúsculo
  const { data, error } = await supabase
    .from("processos")
    .select(`
      *,
      cidades ( idcidade, descricao, idestado ),
      comarcas ( idcomarca, descricao ),
      tribunais ( idtribunal, descricao ),
      varas ( idvara, descricao ),
      instancias ( idinstancia, descricao )
    `)
    .eq("idprocesso", id)
    .single();

  if (error) throw error;
  return data;
};

export const criarProcesso = async (dados) => {
  const { data, error } = await supabase
  .from("processos")
  .insert([dados])
  .select();

  if (error) throw error;
  return data;
};

export const atualizarProcesso = async (id, dados) => {
  const { data, error } = await supabase
  .from("processos").update(dados)
  .eq("idprocesso", id)
  .select();

  if (error) throw error;
  return data;
};

export const excluirProcesso = async (id) => {
  const { error } = await supabase
  .from("processos")
  .delete()
  .eq("idprocesso", id);
  
  if (error) throw error;
  return true;
};