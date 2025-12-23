import express from "express";
import supabase from "../config/supabase.js";
import { injectTenant, withTenantFilter } from "../repositories/tenantScope.js";

const router = express.Router();

// Listar pessoas (pode filtrar por nome ?busca=X)
router.get("/", async (req, res) => {
  try {
    const { busca } = req.query;
    let query = withTenantFilter("pessoas", req.tenantId)
      .select("*")
      .order("nome");
    
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
    const payload = injectTenant(req.body, req.tenantId);
    const { data, error } = await supabase
      .from("pessoas")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;