import express from "express";
import { upload } from "../middlewares/multer.js";
import * as uploadController from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadController.uploadFile);
  
//   ROTA PRINCIPAL: (LISTAGEM DA TABELA)

router.get("/publicacoes", uploadController.listPublications);


export default router;
