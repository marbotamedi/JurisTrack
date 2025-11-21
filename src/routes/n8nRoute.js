import express from "express";
import * as n8nService from "../services/n8nService.js";

const router = express.Router();

//   ROTA WEBHOOK N8N: (FINALIZAÇÃO DO PROCESSO)
//   URL: POST /n8n/complete

router.post("/complete", n8nService.completeProcess);

export default router;