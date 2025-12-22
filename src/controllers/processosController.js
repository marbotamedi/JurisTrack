import * as processosService from "../services/processosService.js";
import supabase from "../config/supabase.js";

export const listarProcessos = async (req, res) => {
  try {
    const lista = await processosService.listarProcessos(req.query);
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obterProcesso = async (req, res) => {
  try {
    const processo = await processosService.obterProcessoCompleto(req.params.id);
    res.status(200).json(processo);
  } catch (error) {
    console.error("Erro ao buscar processo:", error);
    res.status(500).json({ error: error.message });
  }
};

export const criarProcesso = async (req, res) => {
  try {
    const novo = await processosService.criarProcesso(req.body);
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const atualizarProcesso = async (req, res) => {
  try {
    const atualizado = await processosService.atualizarProcesso(req.params.id, req.body);
    res.status(200).json(atualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const excluirProcesso = async (req, res) => {
  try {
    await processosService.excluirProcesso(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- FUNÇÃO DE ANDAMENTO MANUAL ---
export const criarAndamentoManual = async (req, res) => {
  try {
    const { processoId, data_evento, descricao, responsavelId } = req.body;
    
    if (!processoId || !descricao) {
      return res.status(400).json({ error: "Processo e Descrição são obrigatórios." });
    }

    // Insere na tabela Andamento respeitando as colunas com aspas
    const { data, error } = await supabase
      .from("Andamento") 
      .insert([{
          "processoId": processoId,
          "data_evento": data_evento,
          "descricao": descricao,
          "responsavelId": responsavelId
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Erro ao criar andamento:", error);
    res.status(500).json({ error: "Erro ao salvar andamento." });
  }
};

export const obterContextoModelo = async (req, res) => {
  try {
    const { id } = req.params; // Pega o ID da URL
    
    // Chama o serviço que criamos acima
    const contexto = await processosService.obterContextoParaModelo(id);
    
    if (!contexto) {
      return res.status(404).json({ error: "Processo não encontrado para gerar contexto." });
    }

    res.status(200).json(contexto);
  } catch (error) {
    console.error("Erro ao obter contexto do modelo:", error);
    res.status(500).json({ error: error.message });
  }
};