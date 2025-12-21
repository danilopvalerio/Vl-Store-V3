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

const router = Router();

// Dependências de Log
const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const logService = new LogService(accessRepo, systemRepo);

// Dependências de User
const repository = new UserRepository();
const service = new UserService(repository, logService);
const controller = new UserController(service);

router.use(authMiddleware);

router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.create
);

router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.listPaginated
);

router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.searchPaginated
);

router.get("/:id", controller.getById);

router.patch("/:id", controller.update);

router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), controller.delete);

export default router;
