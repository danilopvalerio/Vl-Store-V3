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
import { validate } from "../../app/middleware/validation.middleware";
import {
  uploadProfilePhoto,
  processProfilePhoto,
} from "../../app/middleware/upload.middleware";
import {
  createUserProfileSchema,
  updateUserProfileSchema,
  userProfileIdSchema,
  userIdParamSchema,
} from "./user_profile.schema";

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

// --- ROTAS ESTÁTICAS (devem vir antes das dinâmicas com :id) ---

// Criar perfil sem foto
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(createUserProfileSchema),
  controller.create,
);

// Criar perfil com foto
router.post(
  "/with-photo",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  uploadProfilePhoto,
  processProfilePhoto,
  controller.createWithPhoto,
);

// Listar perfis
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getAll,
);

// Buscar perfil pelo user_id
router.get(
  "/user/:userId",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(userIdParamSchema),
  controller.getByUserId,
);

// Paginação
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getPaginated,
);

// Busca
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.searchPaginated,
);

// --- ROTAS DINÂMICAS (com :id) ---

// Avatar (foto de perfil via sendFile)
router.get("/:id/avatar", validate(userProfileIdSchema), controller.getAvatar);

// Upload/atualizar foto de perfil existente
router.post(
  "/:id/photo",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(userProfileIdSchema),
  uploadProfilePhoto,
  processProfilePhoto,
  controller.uploadPhoto,
);

// Remover foto de perfil
router.delete(
  "/:id/photo",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(userProfileIdSchema),
  controller.deletePhoto,
);

// Buscar por ID do perfil
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(userProfileIdSchema),
  controller.getById,
);

// Atualizar cargo/perfil
router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(updateUserProfileSchema),
  controller.update,
);

// Demitir (Remover perfil)
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(userProfileIdSchema),
  controller.remove,
);

export default router;
