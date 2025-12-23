import supabase from "../config/supabase.js";

// --- ESTADOS ---
export const listarEstados = async (busca) => {
  let query = supabase.from("estados").select("*").order("descricao");
  
  if (busca) {
    // Busca Estado que COMEÇA com o termo ou UF que COMEÇA com o termo
    query = query.or(`descricao.ilike.${busca}%,uf.ilike.${busca}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const salvarEstado = async (dados) => {
  const payload = { 
    descricao: dados.descricao, 
    uf: dados.uf,
    ativo: dados.ativo ?? true // Adicione esta linha
  };

  if (dados.idestado) {
    const { data, error } = await supabase
      .from("estados")
      .update(payload)
      .eq("idestado", dados.idestado)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("estados")
      .insert([payload])
      .select();
    if (error) throw error;
    return data;
  }
};

export const deletarEstado = async (id) => {
  const { error } = await supabase
  .from("estados")
  .delete()
  .eq("idestado", id);
  
  if (error) throw error;
  return true;
};

// --- CIDADES ---
export const listarCidades = async (busca, idEstado) => {
  // 1. Prepara a Query Base
  let query = supabase
    .from("cidades")
    .select(`
      idcidade,
      descricao,
      idestado,
      ativo,
      estados ( uf, descricao )
    `);

  // 2. Se tiver ID do Estado, filtra direto no Banco (Muito mais rápido e preciso)
  if (idEstado && idEstado !== "undefined" && idEstado !== "") {
    query = query.eq("idestado", idEstado);
  }

  // 3. Ordenação e AUMENTO DO LIMITE (Range)
  // O Supabase limita a 1000 por padrão. Colocamos 9999 para garantir todas as cidades.
  const { data, error } = await query
    .order("descricao")
    .range(0, 9999);

  if (error) throw error;

  // 4. Filtragem de Texto (Busca por nome) no Backend (mantendo sua lógica original)
  if (busca) {
    const termo = busca.toLowerCase().trim();
    
    return data.filter(cidade => {
      if (!cidade.estados) return false;

      const nomeCidade = cidade.descricao ? cidade.descricao.toLowerCase() : "";
      const ufEstado = cidade.estados.uf ? cidade.estados.uf.toLowerCase() : "";

      if (termo.length === 2) {
        return ufEstado === termo;
      } else {
        return nomeCidade.includes(termo);
      }
    });
  }

  return data;
};

export const salvarCidade = async (dados) => {
  const payload = { 
    descricao: dados.descricao, 
    idestado: dados.idestado,
    ativo: dados.ativo ?? true // Adicione esta linha
  };

  if (dados.idcidade) {
    const { data, error } = await supabase
      .from("cidades")
      .update(payload)
      .eq("idcidade", dados.idcidade)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("cidades")
      .insert([payload])
      .select();
    if (error) throw error;
    return data;
  }
};

export const deletarCidade = async (id) => {
  const { error } = await supabase
  .from("cidades")
  .delete()
  .eq("idcidade", id);

  if (error) throw error;
  return true;
};