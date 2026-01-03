import supabase from "../config/supabase.js";

export const listarTabela = async (tabela) => {
  // OTIMIZAÇÃO: Por padrão, tenta buscar count exato, mas vamos refinar as colunas abaixo
  let query = supabase.from(tabela).select("*", { count: 'exact' });
  
  // --- OTIMIZAÇÕES DE PERFORMANCE PARA SELECTS ---
  
  if (tabela === "situacoes") {
    // Traz apenas ID e Descrição (muito leve)
    query = supabase.from(tabela).select("idsituacao, descricao, ativo");
  }

  if (tabela === "comarcas") {
     // Traz ID, Descrição e UF. Remove dados pesados.
     query = supabase.from(tabela).select(`
        idcomarca, 
        descricao, 
        estados (descricao, uf ),
        ativo
    `);
  }

  // --- JOINS ESPECÍFICOS OUTRAS TABELAS ---

  if (tabela === "tribunais") {
    query = supabase.from(tabela).select(`
      idtribunal, descricao,
      instancias ( descricao ),
      comarcas ( descricao ),
      ativo
    `);
  }

  if (tabela === "varas") {
    query = supabase.from(tabela).select(`
      idvara, descricao,
      tribunais ( descricao ),
      ativo
    `);
  }

  // Ordenação
  let colunaOrdenacao = "descricao";
  if (tabela === "pessoas") colunaOrdenacao = "nome";

  // Executa a query
  // Range mantido alto, mas como o payload é leve, será rápido.
  const { data, error } = await query
    .order(colunaOrdenacao, { ascending: true })
    .range(0, 9999);

  if (error) throw error;
  return data;
};

/**
 * Cria ou atualiza um registo.
 */
export const salvarRegisto = async (tabela, campoId, dados) => {
  const id = dados[campoId];
  
  // Garante que o ativo seja respeitado (true ou false)
  const payload = { 
    ...dados, 
    ativo: dados.ativo ?? true 
  };
  
  if (id) {
    const { data, error } = await supabase
      .from(tabela)
      .update(payload)
      .eq(campoId, id)
      .select();
    if (error) throw error;
    return data;
  } else {
    delete payload[campoId];
    const { data, error } = await supabase
      .from(tabela)
      .insert([payload])
      .select();
    if (error) throw error;
    return data;
  }
};

/**
 * Soft Delete (Exclusão Lógica).
 */
export const eliminarRegisto = async (tabela, campoId, id) => {
  const { error } = await supabase
    .from(tabela)
    .update({ ativo: false }) 
    .eq(campoId, id);

  if (error) throw error;
  return true;
};