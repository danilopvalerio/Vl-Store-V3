//src/modules/sale/venda.routes.ts
import { Router } from "express";
import { VendaController } from "./venda.controller";
import { VendaService } from "./venda.service";

// Importando os repositórios separados
import { VendaRepository } from "./venda.repository";
import { ItemVendaRepository } from "./item_venda.repository";
import { VendaAuxRepository } from "./venda-aux.repository";

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
  createVendaSchema,
  vendaIdSchema,
  vendaPaginationSchema,
  updateStatusSchema, // <--- CORREÇÃO AQUI (Nome exato do export no schema.ts)
} from "./venda.schema";

const router = Router();

// ============================================================================
// INJEÇÃO DE DEPENDÊNCIA
// ============================================================================

// 1. Logs
const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

// 2. Repositórios de Venda (Separados)
const vendaRepo = new VendaRepository();
const itemRepo = new ItemVendaRepository();
const auxRepo = new VendaAuxRepository();

// 3. Service (Recebe os 3 repositórios + Log)
const service = new VendaService(vendaRepo, itemRepo, auxRepo, logService);

// 4. Controller
const controller = new VendaController(service);

// ============================================================================
// DEFINIÇÃO DAS ROTAS
// ============================================================================

router.use(authMiddleware);

// Criar Venda (Fluxo completo com itens e baixa de estoque)
router.post(
  "/",
  requireRole(["ADMIN", "GERENTE", "FUNCIONARIO", "VENDEDOR"]),
  validate(createVendaSchema),
  controller.create
);

// Atualizar Status (Ex: Cancelar)
router.patch(
  "/:id/status",
  requireRole(["ADMIN", "GERENTE"]),
  validate(updateStatusSchema), // <--- USO CORRIGIDO AQUI
  controller.updateStatus
);

// Listar Vendas (Paginado)
router.get(
  "/paginated",
  requireRole(["ADMIN", "GERENTE", "FUNCIONARIO", "VENDEDOR"]),
  validate(vendaPaginationSchema),
  controller.getPaginated
);

// Buscar Vendas (Search)
router.get(
  "/search",
  requireRole(["ADMIN", "GERENTE", "FUNCIONARIO", "VENDEDOR"]),
  validate(vendaPaginationSchema),
  controller.searchPaginated
);

// Obter Venda por ID (Detalhes completos)
router.get(
  "/:id",
  requireRole(["ADMIN", "GERENTE", "FUNCIONARIO", "VENDEDOR"]),
  validate(vendaIdSchema),
  controller.getById
);

export default router;
