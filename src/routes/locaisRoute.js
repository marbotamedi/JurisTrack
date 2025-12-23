import express from "express";
import * as locaisController from "../controllers/locaisController.js";

const router = express.Router();

// Rotas de API para Estados
router.get("/estados", locaisController.getEstados);
router.post("/estados", locaisController.postEstado);
router.delete("/estados/:id", locaisController.deleteEstado);

// Rotas de API para Cidades
router.get("/cidades", locaisController.getCidades);
router.post("/cidades", locaisController.postCidade);
router.delete("/cidades/:id", locaisController.deleteCidade);

export default router;