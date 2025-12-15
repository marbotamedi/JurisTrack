import express from "express";
import * as processosController from "../controllers/processosController.js";

const router = express.Router();

// Rota para buscar lista filtrada
router.get("/", processosController.listar);
// Rota para buscar um processo específico (Ficha)
router.get("/:id", processosController.buscarPorId);
// Rota para criar/salvar
router.post("/", processosController.salvar);
// Rota para atualizar
router.put("/:id", processosController.atualizar);
// Rota para excluir
router.delete("/:id", processosController.excluir);

export default router;