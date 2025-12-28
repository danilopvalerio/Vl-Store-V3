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
import { validate } from "../../app/middleware/validation.middleware";
import {
  createCaixaSchema,
  toggleCaixaStatusSchema,
  caixaIdSchema,
  caixaPaginationSchema,
  createMovimentacaoSchema,
  updateMovimentacaoSchema,
  movIdSchema,
  movPaginationSchema,
} from "./caixa.schema";

const router = Router();

const accessRepo = new AccessLogRepository();
const systemRepo = new SystemLogRepository();
const logService = new LogService(accessRepo, systemRepo);

const caixaRepo = new CaixaRepository();
const movRepo = new MovimentacaoRepository();

const service = new CaixaService(caixaRepo, movRepo, logService);
const controller = new CaixaController(service);

router.use(authMiddleware);

// ==========================================================
// 1. ROTAS ESPECÍFICAS (Devem vir ANTES de /:id)
// ==========================================================

// Buscar caixa ativo do usuário logado
router.get(
  "/me/active",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getCurrentUserCaixa
);

// Listar Movimentações (MOVIDO PARA CIMA)
router.get(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(movPaginationSchema),
  controller.getMovimentacoesPaginated
);

// Criar Movimentação (Sangria/Suprimento) (MOVIDO PARA CIMA)
router.post(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(createMovimentacaoSchema),
  controller.addMovimentacao
);

// Atualizar Movimentação (MOVIDO PARA CIMA)
router.patch(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(updateMovimentacaoSchema),
  controller.updateMovimentacao
);

// Deletar Movimentação (MOVIDO PARA CIMA)
router.delete(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(movIdSchema),
  controller.deleteMovimentacao
);

// Listar Caixas (Geral)
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(caixaPaginationSchema),
  controller.getPaginated
);

// Abrir Caixa
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(createCaixaSchema),
  controller.openCaixa
);

// ==========================================================
// 2. ROTAS GENÉRICAS / PARAMETRIZADAS (Devem vir POR ÚLTIMO)
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

// Buscar por ID (O GRANDE VILÃO ESTAVA AQUI)
// Como ele pega qualquer string após a barra, ele estava capturando "movimentacoes"
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(caixaIdSchema),
  controller.getCaixaById
);

export default router;
