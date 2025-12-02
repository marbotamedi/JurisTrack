import express from "express";
// IMPORTANTE: Verifique se o caminho abaixo está correto e se tem o .js no final
import * as n8nController from "../controllers/n8nController.js"; 

const router = express.Router();

// AQUI OCORRE O ERRO: Se n8nController.completeProcess não existir, o servidor cai.
router.post("/complete", n8nController.completeProcess);

export default router;