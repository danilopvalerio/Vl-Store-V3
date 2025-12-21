import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { ProductRepository } from "./product.repository";
import { LogService } from "../logs/log.service";
import {
  AccessLogRepository,
  SystemLogRepository,
} from "../logs/log.repository"; // <--- Importe os repositórios de log
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";

const router = Router();

// ============================================================================
// INJEÇÃO DE DEPENDÊNCIA
// ============================================================================

// 1. Instancia as dependências do LogService
const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

// 2. Instancia as dependências do ProductService
const repository = new ProductRepository();
const service = new ProductService(repository, logService);
const controller = new ProductController(service);

router.use(authMiddleware);

// =================================================
// 1. ROTAS GERAIS DE PRODUTO (Sem ID na URL)
// =================================================

// GET /products/paginated
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getPaginated
);

// GET /products/search
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.searchPaginated
);

// =================================================
// 2. ROTAS DE VARIAÇÕES (CRUD Direto)
// =================================================

router.post(
  "/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.createVariation
);

router.get(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getVariationById
);

router.patch(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.updateVariation
);

router.delete(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.deleteVariation
);

// =================================================
// 3. ROTAS ANINHADAS (Produto -> Variações)
// =================================================

router.get(
  "/:id/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getPaginatedProductVariations
);

router.get(
  "/:id/variations/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.searchProductVariations
);

// =================================================
// 4. ROTAS DE PRODUTO ESPECÍFICO (CRUD pelo ID)
// =================================================

router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.createProduct
);

router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getProductById
);

router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.updateProduct
);

router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.deleteProduct
);

export default router;
