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
    .eq("idprocesso", id) // O Supabase costuma normalizar para minúsculo
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Criar novo processo
export const createProcesso = async (dados) => {
  // dados deve conter chaves compatíveis com o banco (ex: numprocesso, pasta...)
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
  // Primeiro, buscamos as publicações deste processo
  const { data: publicacoes, error: errPub } = await supabase
    .from("Publicacao")
    .select("id")
    .eq("processoid", idProcesso);

  if (errPub) throw new Error(errPub.message);

  if (!publicacoes || publicacoes.length === 0) return [];

  const listaIdsPub = publicacoes.map((p) => p.id);

  // Agora buscamos as petições dessas publicações
  const { data: peticoes, error: errPet } = await supabase
    .from("Historico_Peticoes")
    .select("id, created_at, modelo_utilizado, publicacao_id, conteudo_html ")
    .in("publicacao_id", listaIdsPub)
    .order("created_at", { ascending: false });

  if (errPet) throw new Error(errPet.message);

  return peticoes;
};
