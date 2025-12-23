import supabase from "../config/supabase.js";
import { injectTenant, withTenantFilter } from "../repositories/tenantScope.js";

// Apenas lógica de banco e negócio
export const createLogPeticao = async (dados, tenantId) => {
  const { data, error } = await supabase
    .from("Historico_Peticoes")
    .insert([
      injectTenant(
        {
          publicacao_id: dados.publicacao_id,
          conteudo_html: dados.conteudo_final,
          modelo_utilizado: dados.modelo_utilizado,
        },
        tenantId
      ),
    ])
    .select()
    .single(); // .single() já retorna o objeto direto, sem ser array

  if (error) throw new Error(error.message);
  return data;
};

export const getHistoricoFormatado = async (tenantId) => {
  const { data, error } = await withTenantFilter(
    "Historico_Peticoes",
    tenantId
  )
    .select(
      `
      id,
      created_at,
      modelo_utilizado,
      conteudo_html,
      publicacao_id,
      Publicacao (
        processos ( numprocesso )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // A formatação é regra de negócio/apresentação, fica aqui no service
  return data.map(item => ({
    id: item.id,
    data_criacao: item.created_at,
    modelo: item.modelo_utilizado || "Sem modelo",
    num_processo: item.Publicacao?.processos?.numprocesso || "N/A",
    publicacao_id: item.publicacao_id,
    conteudo: item.conteudo_html
  }));
};