import express from "express";
import { tenantContextMiddleware } from "../middlewares/tenantContextMiddleware.js";
import * as peticoesController from "../controllers/peticaoController.js";

const router = express.Router();

router.use(tenantContextMiddleware);

router.post("/", peticoesController.salvarLogPeticao);
router.get("/", peticoesController.listarHistorico); 

export default router;