import { Router } from "express";
import PetController from "../controllers/PetController.js";

const router = Router();

router.get("/", PetController.findAll);
router.get("/search/:keyword", PetController.searchByKeyword);
router.get("/:id", PetController.findById);
router.post("/", PetController.create);
router.put("/:id", PetController.update);
router.delete("/:id", PetController.remove);

export default router;