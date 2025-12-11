import supabase from "../config/supabase.js";

export const registrarLog = async (acao, descricao, meta_dados = {}, usuario = 'sistema') => {
  console.log(`[LOG] ${acao}: ${descricao}`); // Log no terminal
  
  const { error } = await supabase
    .from("Logs_Auditoria")
    .insert([{ acao, descricao, meta_dados, usuario }]);

  if (error) console.error("Erro ao salvar log no banco:", error.message);
};