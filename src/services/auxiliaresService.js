import supabase from "../config/supabase.js";

/**
 * Lista registos de uma tabela auxiliar.
 */
export const listarTabela = async (tabela) => {
  let query = supabase.from(tabela).select("*");

  // AJUSTE: Joins específicos para trazer os nomes nas tabelas relacionadas
  
  if (tabela === "tribunais") {
    // Busca nome da Instância e Comarca
    query = supabase.from(tabela).select(`
      *,
      instancias ( descricao ),
      comarcas ( descricao )
    `);
  }

  if (tabela === "varas") {
    // Busca nome do Tribunal
    query = supabase.from(tabela).select(`
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

  const { data, error } = await query.order("descricao");

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
 * Soft Delete.
 */
export const eliminarRegisto = async (tabela, campoId, id) => {
  const { error } = await supabase
    .from(tabela)
    .update({ ativo: false }) 
    .eq(campoId, id);

  if (error) throw error;
  return true;
};