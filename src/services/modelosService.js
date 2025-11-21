import supabase from "../config/supabase.js";

/**
 * Cria um novo modelo no banco.
 * @param {Object} dadosModelo - Objeto contendo titulo, descricao, conteudo, tags
 */
export const createModelo = async (dadosModelo) => {
  const { data, error } = await supabase
    .from("Modelos_Peticao")
    .insert([dadosModelo])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Lista todos os modelos (apenas campos leves para listagem).
 */
export const listModelos = async () => {
  const { data, error } = await supabase
    .from("Modelos_Peticao")
    // Seleciona apenas o necessário para a lista (sem o conteudo pesado)
    .select("id, titulo, descricao, tags")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Busca um modelo completo pelo ID.
 */
export const getModeloById = async (id) => {
  const { data, error } = await supabase
    .from("Modelos_Peticao")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Atualiza um modelo existente.
 */
export const updateModelo = async (id, dadosAtualizados) => {
  const { data, error } = await supabase
    .from("Modelos_Peticao")
    .update(dadosAtualizados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Deleta um modelo.
 */
export const deleteModelo = async (id) => {
  const { data, error } = await supabase
    .from("Modelos_Peticao")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};