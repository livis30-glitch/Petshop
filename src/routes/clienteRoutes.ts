import { Router } from "express";
import ClienteController from "../controllers/ClienteController.js";

const router = Router();

router.get("/", ClienteController.findAll);
router.get("/search/:keyword", ClienteController.searchByKeyword);
router.get("/:id", ClienteController.findById);
router.post("/", ClienteController.create);
router.put("/:id", ClienteController.update);
router.delete("/:id", ClienteController.remove);

export default router;