import { Router } from "express";
import { UserProfileController } from "./user_profile.controller";
import { UserProfileService } from "./user_profile.service";
import { UserProfileRepository } from "./user_profile.repository";
import { LogService } from "../logs/log.service";
import {
  AccessLogRepository,
  SystemLogRepository,
} from "../logs/log.repository";
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";
import { validate } from "../../app/middleware/validation.middleware"; // <--- SEU MIDDLEWARE
import {
  createUserProfileSchema,
  updateUserProfileSchema,
  userProfileIdSchema,
  userIdParamSchema,
} from "./user_profile.schema"; // <--- SEUS SCHEMAS

const router = Router();

// Injeção de Dependências
const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const logService = new LogService(accessRepo, systemRepo);

const repository = new UserProfileRepository();
const service = new UserProfileService(repository, logService);
const controller = new UserProfileController(service);

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// --- ROTAS GERAIS ---
// Criar novo perfil: Adicionado validate(createUserProfileSchema)
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(createUserProfileSchema),
  controller.create
);

// Listar perfis
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getAll
);

// Buscar perfil pelo user_id
// Adicionado validação do parametro userId
router.get(
  "/user/:userId",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(userIdParamSchema),
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
// Buscar por ID do perfil
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(userProfileIdSchema),
  controller.getById
);

// Atualizar cargo/perfil
// Adicionado validate(updateUserProfileSchema)
router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(updateUserProfileSchema),
  controller.update
);

// Demitir (Remover perfil)
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(userProfileIdSchema),
  controller.remove
);

export default router;
