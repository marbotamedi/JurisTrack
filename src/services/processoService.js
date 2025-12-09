// src/services/processoService.js
import supabase from "../config/supabase.js";

// Listar todos os processos
export const getAllProcessos = async () => {
  const { data, error } = await supabase
    .from("processos")
    .select("*")
    .order("datainicial", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// Buscar processo por ID
export const getProcessoById = async (id) => {
  const { data, error } = await supabase
    .from("processos")
    .select("*")
    .eq("idprocesso", id) // Note: Postgres converteu IdProcesso para idprocesso
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Criar novo processo
export const createProcesso = async (dados) => {
  // dados deve conter: { numprocesso, pasta, obs, datainicial, descricao ... }
  const { data, error } = await supabase
    .from("processos")
    .insert([dados])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Atualizar processo
export const updateProcesso = async (id, dados) => {
  const { data, error } = await supabase
    .from("processos")
    .update(dados)
    .eq("idprocesso", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Deletar processo
export const deleteProcesso = async (id) => {
  const { error } = await supabase
    .from("processos")
    .delete()
    .eq("idprocesso", id);

  if (error) throw new Error(error.message);
  return { message: "Processo deletado com sucesso." };
};

/**
 * Busca petições (Histórico) relacionadas a um processo específico.
 * Caminho: Historico_Peticoes -> Publicacao -> Processos
 */
export const getPeticoesByProcesso = async (idProcesso) => {
  // Buscamos as petições onde a Publicação vinculada pertence a este processo
  // faz inner join entre Historico_Peticoes e Publicacao
  const { data, error } = await supabase
    .from("Historico_Peticoes")
    .select(`
      id,
      created_at,
      modelo_utilizado,
      Publicacao!inner (
        processoid
      )
    `)
    .eq("Publicacao.processoid", idProcesso)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};