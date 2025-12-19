// src/routes/dashboard.routes.ts
import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new DashboardController();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// =================================================
// ROTAS DE DASHBOARD
// =================================================

// GET /api/dashboard -> Retorna resumo financeiro e operacional
// Acesso restrito: Apenas gestão
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getSummary
);

export default router;
