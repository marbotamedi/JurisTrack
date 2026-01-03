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

// Obter pessoa por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await withTenantFilter("pessoas", req.tenantId)
      .select("*")
      .eq("idpessoa", id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar pessoa
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    
    // Segurança: garantir que tenant_id não seja alterado e filtrar pelo tenant atual
    delete payload.idpessoa;
    delete payload.tenant_id;
    delete payload.created_at;

    const { data, error } = await supabase
      .from("pessoas")
      .update(payload)
      .eq("idpessoa", id)
      .eq("tenant_id", req.tenantId)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;