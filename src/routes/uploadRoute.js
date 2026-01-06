import express from "express";
import { upload, uploadPdf } from "../middlewares/multer.js";
import { tenantContextMiddleware } from "../middlewares/tenantContextMiddleware.js";
import * as uploadController from "../controllers/uploadController.js";

const router = express.Router();

router.use(tenantContextMiddleware);


router.post("/", upload.single("file"), uploadController.uploadFile);


router.post("/analise", uploadPdf.single("file"), uploadController.uploadFile);
  

router.get("/publicacoes", uploadController.listPublications);
router.delete("/:id", uploadController.deleteFile);

export default router;