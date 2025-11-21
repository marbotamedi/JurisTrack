import express from "express";
import * as modalController from "../controllers/modalController.js";

const router = express.Router();

// ROTA MODAL 1: (RESULTADO DO PROCESSAMENTO)
router.get("/resultado/:nome", modalController.getResult);

// ROTA MODAL 2: (HISTÓRICO DO PROCESSO)
router.get("/publicacoes/processo/:numero", modalController.getHistory);

// ROTA GERADOR PETIÇÃO (DADOS COMPLETOS)
router.get("/process-data/:pubId", modalController.getFullData);

export default router;