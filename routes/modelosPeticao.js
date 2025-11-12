import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

/**
 * @route POST /modelos
 * @desc Cria um novo modelo de petição.
 */
router.post("/", async (req, res) => {
  const { titulo, descricao, tags, conteudo } = req.body;

  // Validação simples
  if (!titulo || !conteudo) {
    return res
      .status(400)
      .json({ error: "Título e Conteúdo são obrigatórios." });
  }

  // Tags podem ser uma string separada por vírgulas, convertemos para array
  const tagsArray =
    tags && typeof tags === "string"
      ? tags.split(",").map((tag) => tag.trim())
      : [];

  try {
    const { data, error } = await supabase
      .from("Modelos_Peticao")
      .insert([
        {
          titulo,
          descricao,
          conteudo,
          tags: tagsArray.length > 0 ? tagsArray : null, // Salva como array ou null
        },
      ])
      .select()
      .single(); // Retorna o objeto criado

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Erro ao criar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /modelos
 * @desc Lista todos os modelos de petição.
 */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("Modelos_Peticao")
      .select("id, titulo, descricao, tags") // Não traz o 'conteudo' para não pesar a lista
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao listar modelos:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /modelos/:id
 * @desc Busca um modelo de petição completo pelo ID.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("Modelos_Peticao")
      .select("*") // Traz tudo, inclusive o 'conteudo'
      .eq("id", id)
      .single(); // Espera um único resultado

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao buscar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /modelos/:id
 * @desc Atualiza um modelo de petição.
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, tags, conteudo } = req.body;

  // Validação
  if (!titulo || !conteudo) {
    return res
      .status(400)
      .json({ error: "Título e Conteúdo são obrigatórios." });
  }

  // Converte tags
  const tagsArray =
    tags && typeof tags === "string"
      ? tags.split(",").map((tag) => tag.trim())
      : Array.isArray(tags)
      ? tags
      : [];

  try {
    const { data, error } = await supabase
      .from("Modelos_Peticao")
      .update({
        titulo,
        descricao,
        conteudo,
        tags: tagsArray.length > 0 ? tagsArray : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /modelos/:id
 * @desc Deleta um modelo de petição.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("Modelos_Peticao")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Modelo não encontrado." });
    }

    res.status(200).json({ message: "Modelo deletado com sucesso.", data });
  } catch (error) {
    console.error("Erro ao deletar modelo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;