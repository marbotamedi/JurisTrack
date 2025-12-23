import express from "express";
import * as peticoesController from "../controllers/peticaoController.js";

const router = express.Router();

router.post("/", peticoesController.salvarLogPeticao);
router.get("/", peticoesController.listarHistorico); 

export default router;