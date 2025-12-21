import { Router } from "express";
import { CaixaController } from "./caixa.controller";
import { CaixaService } from "./caixa.service";
import { CaixaRepository, MovimentacaoRepository } from "./caixa.repository";
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

// 1. Instancia Logs
const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const logService = new LogService(accessRepo, systemRepo);

// 2. Instancia Repositórios de Caixa/Movimentacao
const caixaRepo = new CaixaRepository();
const movRepo = new MovimentacaoRepository();

// 3. Instancia Serviço e Controller
const service = new CaixaService(caixaRepo, movRepo, logService);
const controller = new CaixaController(service);

// --- ROTAS ---
router.use(authMiddleware);

// --- CONTEXTO DO USUÁRIO ---
router.get(
  "/me/active",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getCurrentUserCaixa
);

router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.openCaixa
);

router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getPaginated
);

// --- MOVIMENTAÇÕES ---
router.get(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getMovimentacoesPaginated
);

router.post(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.addMovimentacao
);

router.patch(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.updateMovimentacao
);

router.delete(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.deleteMovimentacao
);

// --- CAIXA ESPECÍFICO ---
router.get(
  "/:id/dashboard",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getDashboardInfo
);

router.patch(
  "/:id/status",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.toggleCaixaStatus
);

router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getCaixaById
);

export default router;
