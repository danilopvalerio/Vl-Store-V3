//src/routes/caixa.routes.ts
import { Router } from "express";
import { CaixaController } from "../controllers/caixa.controller";
// Certifique-se de que o caminho do middleware de auth está correto no seu projeto
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new CaixaController();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// =================================================
// 1. ROTAS DE CONTEXTO DO USUÁRIO
// =================================================

// GET /caixas/me/active -> Busca caixa aberto do logado
router.get(
  "/me/active",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getCurrentUserCaixa.bind(controller)
);

// POST /caixas -> Abrir Caixa
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.openCaixa.bind(controller)
);

// GET /caixas -> Listagem com Paginação e Busca (?page=1&term=joao)
router.get(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getPaginated.bind(controller)
);

// =================================================
// 2. ROTAS DE MOVIMENTAÇÕES
// =================================================
// =================================================
// 2. ROTAS DE MOVIMENTAÇÕES
// =================================================

// GET /caixas/movimentacoes (Listagem Geral ou Busca)
// ?page=1 & term=sangria & caixaId=uuid (opcional)
router.get(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]), // Geralmente restrito a gestão
  controller.getMovimentacoesPaginated.bind(controller)
);

// POST (Criar)
router.post(
  "/movimentacoes",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.addMovimentacao.bind(controller)
);

// PUT (Editar)
router.patch(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.updateMovimentacao.bind(controller)
);

// DELETE (Remover)
router.delete(
  "/movimentacoes/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.deleteMovimentacao.bind(controller)
);

// =================================================
// 3. ROTAS DE CAIXA ESPECÍFICO (ID)
// =================================================

router.get(
  "/:id/dashboard",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getDashboardInfo.bind(controller)
);

router.patch(
  "/:id/status",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.toggleCaixaStatus.bind(controller)
);

router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getCaixaById.bind(controller)
);

export default router;
