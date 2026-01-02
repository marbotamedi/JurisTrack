import express from "express";
import { generateN8nToken } from "../controllers/internalController.js";

const router = express.Router();

router.post("/n8n/token", generateN8nToken);

export default router;


