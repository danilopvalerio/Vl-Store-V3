// src/routes/user_profile.routes.ts
import { Router } from "express";
import { UserProfileController } from "../controllers/user_profile.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new UserProfileController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// --- ROTAS GERAIS ---
// Criar novo perfil (Contratar funcionário) -> ADMIN
router.post("/", requireRole(["ADMIN"]), controller.create.bind(controller));

// Listar perfis da loja -> ADMIN ou GERENTE
router.get(
  "/",
  requireRole(["ADMIN", "GERENTE"]),
  controller.getAll.bind(controller)
);

// --- ROTAS ESPECÍFICAS (Devem vir ANTES do /:id) ---
router.get(
  "/paginated",
  requireRole(["ADMIN", "GERENTE"]),
  controller.getPaginated.bind(controller)
);
router.get(
  "/search",
  requireRole(["ADMIN", "GERENTE"]),
  controller.searchPaginated.bind(controller)
);

// --- ROTAS DINÂMICAS (Busca por ID) ---
router.get(
  "/:id",
  requireRole(["ADMIN", "GERENTE"]),
  controller.getById.bind(controller)
);

// Atualizar cargo/perfil -> ADMIN
router.patch(
  "/:id",
  requireRole(["ADMIN"]),
  controller.update.bind(controller)
);

// Demitir (Remover perfil) -> ADMIN
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  controller.remove.bind(controller)
);

export default router;
