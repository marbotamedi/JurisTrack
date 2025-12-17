import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Função auxiliar para criar rotas de listagem simples
const criarRotaListagem = (tabela, orderBy = "descricao") => async (req, res) => {
  try {
    const { data, error } = await supabase.from(tabela).select("*").order(orderBy);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rotas para cada tabela auxiliar
router.get("/comarcas", criarRotaListagem("comarcas"));
router.get("/tribunais", criarRotaListagem("tribunais"));
router.get("/varas", criarRotaListagem("varas"));
router.get("/instancias", criarRotaListagem("instancias"));
router.get("/decisoes", criarRotaListagem("decisoes")); // Confirme se o nome da tabela no Supabase é 'decisoes'

export default router;