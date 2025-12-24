import { Router } from "express";
import { LogController } from "./log.controller";
import { LogService } from "./log.service";
import { AccessLogRepository, SystemLogRepository } from "./log.repository";
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";
import { validate } from "../../app/middleware/validation.middleware"; // <--- Import middleware
import { logPaginationSchema } from "./log.schema"; // <--- Import schema

const router = Router();

// Injeção de Dependências
const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const service = new LogService(accessRepo, systemRepo);
const controller = new LogController(service);

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// ==============================================================================
// LOGS DE ACESSO
// ==============================================================================

router.get(
  "/access",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(logPaginationSchema), // Valida page e limit
  controller.getAccessPaginated
);

router.get(
  "/access/search",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(logPaginationSchema), // Valida page, limit e term
  controller.searchAccessPaginated
);

// ==============================================================================
// LOGS DE SISTEMA
// ==============================================================================

router.get(
  "/system",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(logPaginationSchema),
  controller.getSystemPaginated
);

router.get(
  "/system/search",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(logPaginationSchema),
  controller.searchSystemPaginated
);

export default router;
