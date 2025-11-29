import { Router } from "express";
import { UserProfileController } from "../controllers/user_profile.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new UserProfileController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// --- ROTAS GERAIS ---
// Criar novo perfil: SUPER_ADMIN (na matriz) ou ADMIN (na loja dele)
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.create.bind(controller)
);

// Listar perfis: SUPER_ADMIN vê tudo, ADMIN vê da loja, GERENTE vê da loja
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getAll.bind(controller)
);

// Buscar perfil pelo user_id e não pelo id do perfil (Útil para vincular user-profile pelo user_id na response)
router.get(
  "/user/:userId",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getByUserId.bind(controller)
);

// --- ROTAS ESPECÍFICAS ---
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getPaginated.bind(controller)
);
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.searchPaginated.bind(controller)
);

// --- ROTAS DINÂMICAS ---
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getById.bind(controller)
);

// Atualizar cargo/perfil
router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.update.bind(controller)
);

// Demitir (Remover perfil)
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.remove.bind(controller)
);

export default router;
