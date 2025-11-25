import { Router } from "express";
import { LojaController } from "../controllers/loja.controller";

const router = Router();
const controller = new LojaController();

// Definição das rotas e bind dos métodos do controller
router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export default router;
