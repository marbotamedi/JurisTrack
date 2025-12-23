import supabase from "../config/supabase.js";
import { injectTenant, withTenantFilter } from "../repositories/tenantScope.js";

/**
 * Cria um novo modelo no banco.
 * @param {Object} dadosModelo - Objeto contendo titulo, descricao, conteudo, tags
 */
export const createModelo = async (dadosModelo, tenantId) => {
  const { data, error } = await supabase
    .from("Modelos_Peticao")
    .insert([injectTenant(dadosModelo, tenantId)])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Lista todos os modelos (apenas campos leves para listagem).
 */
export const listModelos = async (tenantId) => {
  const { data, error } = await withTenantFilter(
    "Modelos_Peticao",
    tenantId
  )
    .select("id, titulo, descricao, tags")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Busca um modelo completo pelo ID.
 */
export const getModeloById = async (id, tenantId) => {
  const { data, error } = await withTenantFilter(
    "Modelos_Peticao",
    tenantId
  )
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Atualiza um modelo existente.
 */
export const updateModelo = async (id, dadosAtualizados, tenantId) => {
  const payload = { ...dadosAtualizados };
  delete payload.tenant_id;

  const { data, error } = await withTenantFilter(
    "Modelos_Peticao",
    tenantId
  )
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Deleta um modelo.
 */
export const deleteModelo = async (id, tenantId) => {
  const { data, error } = await withTenantFilter(
    "Modelos_Peticao",
    tenantId
  )
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};