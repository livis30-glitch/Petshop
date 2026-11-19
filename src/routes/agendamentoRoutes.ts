
import { Router } from "express";
import AgendamentoController from "../controllers/AgendamentoController.js";

const router = Router();

router.get("/", AgendamentoController.findAll);
router.get("/search/:keyword", AgendamentoController.searchByKeyword);
router.get("/:id", AgendamentoController.findById);
router.post("/", AgendamentoController.create);
router.put("/:id", AgendamentoController.update);
router.patch("/:id/status", AgendamentoController.updateStatus);
router.delete("/:id", AgendamentoController.remove);

export default router;
