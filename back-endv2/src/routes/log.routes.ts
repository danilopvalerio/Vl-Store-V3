import { Router } from "express";
import { LogController } from "../controllers/log.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new LogController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// ==============================================================================
// LOGS DE ACESSO
// Restrito a SUPER_ADMIN pois exibe IPs e acessos globais do sistema.
// ==============================================================================

// GET /api/logs/access
router.get(
  "/access",
  requireRole(["SUPER_ADMIN"]),
  controller.getAccessPaginated.bind(controller)
);

// GET /api/logs/access/search
router.get(
  "/access/search",
  requireRole(["SUPER_ADMIN"]),
  controller.searchAccessPaginated.bind(controller)
);

// ==============================================================================
// LOGS DE SISTEMA
// Restrito a SUPER_ADMIN pois exibe ações administrativas globais.
// ==============================================================================

// GET /api/logs/system
router.get(
  "/system",
  requireRole(["SUPER_ADMIN"]),
  controller.getSystemPaginated.bind(controller)
);

// GET /api/logs/system/search
router.get(
  "/system/search",
  requireRole(["SUPER_ADMIN"]),
  controller.searchSystemPaginated.bind(controller)
);

export default router;
