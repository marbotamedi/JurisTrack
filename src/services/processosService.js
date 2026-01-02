import supabase from "../config/supabase.js";
import { injectTenant, withTenantFilter } from "../repositories/tenantScope.js";

function sanitizeUpdatePayload(dados) {
  if (!dados || typeof dados !== "object") return {};
  const payload = { ...dados };
  // Nunca permitir troca de tenant via payload do cliente
  delete payload.tenant_id;
  return payload;
}

export const listarProcessos = async (filtros, tenantId) => {
  let query = withTenantFilter("processos", tenantId)
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
    query = query.or(
      `numprocesso.ilike.%${filtros.busca}%,assunto.ilike.%${filtros.busca}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const obterProcessoCompleto = async (id, tenantId) => {
  const { data, error } = await withTenantFilter("processos", tenantId)
    .select(
      `
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
    `
    )
    .eq("idprocesso", id)
    // Garantia de igualdade de tenant nos relacionamentos principais
    .eq("Publicacao.tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const criarProcesso = async (dados, tenantId) => {
  const payload = injectTenant(dados, tenantId);
  const { data, error } = await supabase
    .from("processos")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const atualizarProcesso = async (id, dados, tenantId) => {
  const payload = sanitizeUpdatePayload(dados);
  const { data, error } = await withTenantFilter("processos", tenantId)
    .update(payload)
    .eq("idprocesso", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const excluirProcesso = async (id, tenantId) => {
  const { error } = await withTenantFilter("processos", tenantId)
    .update({ deleted_at: new Date() })
    .eq("idprocesso", id);
  if (error) throw error;
  return true;
};

/**
 * Busca dados do processo e formata para preenchimento de templates (Placeholders)
 */
export const obterContextoParaModelo = async (idProcesso, tenantId) => {
  // Busca os dados fazendo os Joins com as tabelas auxiliares
  const { data, error } = await withTenantFilter("processos", tenantId)
    .select(
      `
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
      reu:pessoas!fk_processos_reu ( nome, cpf_cnpj ),
      advogado:pessoas!fk_processos_advogado ( nome,cpf_cnpj)
    `
    )
    .eq("idprocesso", idProcesso)
    .maybeSingle();
    
  if (error) throw error;
  if (!data) return null;

  const contexto = {
    NumProcesso: data.numprocesso || "S/N",
    Pasta: data.pasta || "",
    DataInicial: data.datainicial
      ? new Date(data.datainicial).toLocaleDateString("pt-BR")
      : "",
    DataSaida: data.datasaida
      ? new Date(data.datasaida).toLocaleDateString("pt-BR")
      : "",
    Obs: data.obs || "",
    ValorCausa: data.valor_causa
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(data.valor_causa)
      : "",
    Classe: data.classe_processual || "",
    Assunto: data.assunto || "",
    Cidade: data.cidades?.descricao || "",
    uf: data.cidades?.estados?.uf || "",
    Comarca: data.comarcas?.descricao || "",
    Tribunal: data.tribunais?.descricao || "",
    Vara: data.varas?.descricao || "",
    Instancia: data.instancias?.descricao || "",
    NOME_AUTOR: data.autor?.nome || "",
    Autor_CPF: data.autor?.cpf_cnpj || "",
    NOME_REU: data.reu?.nome || "",
    Reu_CPF: data.reu?.cpf_cnpj || "",
    NOME_ADVOGADO: data.advogado?.nome || "",
    DATA_ATUAL: new Date().toLocaleDateString("pt-BR"),
  };
  
  return contexto;
};