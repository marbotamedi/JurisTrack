import express from "express";
import * as modelosController from "../controllers/modelosController.js";

const router = express.Router();

router.post("/", modelosController.create);
router.get("/", modelosController.getAll);
router.get("/:id", modelosController.getById);
router.put("/:id", modelosController.update);
router.delete("/:id", modelosController.remove);

export default router;