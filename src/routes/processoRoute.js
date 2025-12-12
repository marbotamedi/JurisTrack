import express from "express";
import * as controller from "../controllers/processoController.js";

const router = express.Router();

router.get("/", controller.listar);
router.post("/", controller.criar);
router.get("/:id", controller.buscarUm);
router.put("/:id", controller.atualizar);
router.delete("/:id", controller.deletar);

// Rota especial: Pega as petições de um processo
router.get("/:id/peticoes", controller.listarPeticoesDoProcesso);

router.get("/dados/todos-prazos", controller.listarPrazos);

export default router;