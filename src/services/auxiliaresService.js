import supabase from "../config/supabase.js";

export const listarTabela = async (tabela) => {
  let query = supabase
  .from(tabela)
  .select("*", 
    { count: 'exact' });

  // Joins específicos para trazer os nomes nas tabelas relacionadas
  if (tabela === "tribunais") {
    query = supabase
    .from(tabela)
    .select(`
      *,
      instancias ( descricao ),
      comarcas ( descricao )
    `);
  }

  if (tabela === "varas") {
    query = supabase
    .from(tabela)
    .select(`
      *,
      tribunais ( descricao )
    `);
  }

  // Se precisar de joins para comarcas (ex: estado), adicione aqui
  if (tabela === "comarcas") {
     // Exemplo se comarcas tiver relação com estados
     query = supabase
     .from(tabela)
     .select(
      `*, estados ( descricao, uf )`
    );
  }

  // Se precisar de joins para pessoas , adicione aqui
  let colunaOrdenacao = "descricao";

  // Se for pessoas, ordena por 'nome'
  if (tabela === "pessoas") {
    colunaOrdenacao = "nome";
  }

  // Executa a query com a ordenação correta e limite alto
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
  // Se vier null/undefined, assume true.
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
    // Removemos o campo ID do payload para inserção automática
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