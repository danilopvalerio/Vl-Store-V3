import { Router } from "express";
import { UserProfileController } from "../controllers/user_profile.controller";

const router = Router();
const controller = new UserProfileController();

// --- ROTAS GERAIS ---
router.post("/", controller.create.bind(controller));
router.get("/", controller.getAll.bind(controller));

// --- ROTAS ESPECÍFICAS (Devem vir ANTES do /:id) ---
router.get("/paginated", controller.getPaginated.bind(controller));
router.get("/search", controller.searchPaginated.bind(controller));

// --- ROTAS DINÂMICAS (Busca por ID) ---
router.get("/:id", controller.getById.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export default router;
