import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "./dashboard.repository";
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";

const router = Router();

// Injeção de Dependências
const repository = new DashboardRepository();
const service = new DashboardService(repository);
const controller = new DashboardController(service);

router.use(authMiddleware);

// GET /api/dashboard
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getSummary
);

export default router;
