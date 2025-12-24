import { Router } from "express";
import { LojaController } from "./loja.controller";
import { LojaService } from "./loja.service";
import { LojaRepository } from "./loja.repository";
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
  createLojaSchema,
  updateLojaSchema,
  lojaIdSchema,
} from "./loja.schema";

const router = Router();

const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

const repository = new LojaRepository();
const service = new LojaService(repository, logService);
const controller = new LojaController(service);

router.use(authMiddleware);

// Ver todas as lojas
router.get("/", requireRole(["SUPER_ADMIN"]), controller.getAll);

// Ver uma loja específica
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(lojaIdSchema),
  controller.getById
);

// Criar loja avulsa
router.post(
  "/",
  requireRole(["SUPER_ADMIN"]),
  validate(createLojaSchema),
  controller.create
);

// Atualizar dados da loja
router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(updateLojaSchema),
  controller.update
);

// Deletar loja
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(lojaIdSchema),
  controller.remove
);

export default router;
