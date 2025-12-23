import express from "express";
import {
  createUserController,
  inactivateUserController,
  listUsersController,
  reactivateUserController,
  updateUserController,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", listUsersController);
router.post("/", createUserController);
router.patch("/:id", updateUserController);
router.post("/:id/inactivate", inactivateUserController);
router.post("/:id/reactivate", reactivateUserController);

export default router;

