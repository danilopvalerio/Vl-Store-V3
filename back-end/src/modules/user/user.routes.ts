import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
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
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userPaginationSchema,
} from "./user.schema";

const router = Router();

// Dependências
const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const logService = new LogService(accessRepo, systemRepo);

const repository = new UserRepository();
const service = new UserService(repository, logService);
const controller = new UserController(service);

router.use(authMiddleware);

// Criar Usuário
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(createUserSchema),
  controller.create
);

// Listar Paginado
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(userPaginationSchema),
  controller.listPaginated
);

// Buscar Paginado (Termo)
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(userPaginationSchema), // Reutiliza schema de paginação que tem 'term' opcional
  controller.searchPaginated
);

// Get By ID
router.get("/:id", validate(userIdSchema), controller.getById);

// Update
router.patch("/:id", validate(updateUserSchema), controller.update);

// Delete
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(userIdSchema),
  controller.delete
);

export default router;
