import { Router } from "express";
import { LogController } from "./log.controller";
import { LogService } from "./log.service";
import { AccessLogRepository, SystemLogRepository } from "./log.repository";
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";

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
// Restrito a SUPER_ADMIN pois exibe IPs e acessos globais do sistema.
// ==============================================================================

router.get(
  "/access",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.getAccessPaginated
);

router.get(
  "/access/search",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.searchAccessPaginated
);

// ==============================================================================
// LOGS DE SISTEMA
// Restrito a SUPER_ADMIN pois exibe ações administrativas globais.
// ==============================================================================

router.get(
  "/system",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.getSystemPaginated
);

router.get(
  "/system/search",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.searchSystemPaginated
);

export default router;
