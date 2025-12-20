import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Listar pessoas (pode filtrar por nome ?busca=X)
router.get("/", async (req, res) => {
  try {
    const { busca } = req.query;
    let query = supabase.from("pessoas").select("*").order("nome");
    
    if (busca) {
      query = query.ilike("nome", `%${busca}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova pessoa (para cadastro rápido via modal futura)
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("pessoas").insert([req.body]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;