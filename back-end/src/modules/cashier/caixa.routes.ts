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
import { validate } from "../../app/middleware/validation.middleware"; // <--- Middleware
import {
  createCaixaSchema,
  toggleCaixaStatusSchema,
  caixaIdSchema,
  caixaPaginationSchema,
  createMovimentacaoSchema,
  updateMovimentacaoSchema,
  movIdSchema,
  movPaginationSchema,
} from "./caixa.schema"; // <--- Schemas

const router = Router();

// Dependências
const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const logService = new LogService(accessRepo, systemRepo);

const caixaRepo = new CaixaRepository();
const movRepo = new MovimentacaoRepository();

const service = new CaixaService(caixaRepo, movRepo, logService);
const controller = new CaixaController(service);

router.use(authMiddleware);

// ==========================================================
// ROTAS DE CAIXA
// ==========================================================

// Buscar caixa ativo do usuário logado
router.get(
  "/me/active",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getCurrentUserCaixa
);

// Abrir Caixa
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(createCaixaSchema),
  controller.openCaixa
);

// Listar Caixas
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(caixaPaginationSchema),
  controller.getPaginated
);

// ==========================================================
// ROTAS DE CAIXA - ESPECÍFICAS (POR ID)
// ==========================================================

// Dashboard do Caixa
router.get(
  "/:id/dashboard",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(caixaIdSchema),
  controller.getDashboardInfo
);

// Alterar Status (Fechar/Reabrir)
router.patch(
  "/:id/status",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(toggleCaixaStatusSchema),
  controller.toggleCaixaStatus
);

// Buscar por ID
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(caixaIdSchema),
  controller.getCaixaById
);

// ==========================================================
// ROTAS DE MOVIMENTAÇÕES
// ==========================================================

// Listar Movimentações
router.get(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(movPaginationSchema),
  controller.getMovimentacoesPaginated
);

// Criar Movimentação (Sangria/Suprimento)
router.post(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(createMovimentacaoSchema),
  controller.addMovimentacao
);

// Atualizar Movimentação
router.patch(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(updateMovimentacaoSchema),
  controller.updateMovimentacao
);

// Deletar Movimentação
router.delete(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(movIdSchema),
  controller.deleteMovimentacao
);

export default router;
