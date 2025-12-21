import { Router } from "express";
import { UserProfileController } from "./user_profile.controller";
import { UserProfileService } from "./user_profile.service";
import { UserProfileRepository } from "./user_profile.repository";
import { LogService } from "../logs/log.service";
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";

const router = Router();

// Injeção de Dependências
const logService = new LogService();
const repository = new UserProfileRepository();
const service = new UserProfileService(repository, logService);
const controller = new UserProfileController(service);

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// --- ROTAS GERAIS ---
// Criar novo perfil: SUPER_ADMIN (na matriz) ou ADMIN (na loja dele)
router.post("/", requireRole(["SUPER_ADMIN", "ADMIN"]), controller.create);

// Listar perfis: SUPER_ADMIN vê tudo, ADMIN vê da loja, GERENTE vê da loja
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getAll
);

// Buscar perfil pelo user_id e não pelo id do perfil
router.get(
  "/user/:userId",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getByUserId
);

// --- ROTAS ESPECÍFICAS ---
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getPaginated
);

router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.searchPaginated
);

// --- ROTAS DINÂMICAS ---
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getById
);

// Atualizar cargo/perfil
router.patch("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), controller.update);

// Demitir (Remover perfil)
router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), controller.remove);

export default router;
