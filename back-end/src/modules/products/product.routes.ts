import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";
import { ProductRepository } from "./product.repository";
import { LogService } from "../logs/log.service";
import {
  AccessLogRepository,
  SystemLogRepository,
} from "../logs/log.repository";
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";
import { validate } from "../../app/middleware/validation.middleware"; // <--- Import middleware
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productPaginationSchema,
  createVariationSchema,
  updateVariationSchema,
  productNestedPaginationSchema,
} from "./product.schema"; // <--- Import schemas

const router = Router();

const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

const repository = new ProductRepository();
const service = new ProductService(repository, logService);
const controller = new ProductController(service);

router.use(authMiddleware);

// =================================================
// 1. ROTAS GERAIS DE PRODUTO
// =================================================

// GET /products/paginated
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(productPaginationSchema),
  controller.getPaginated
);

// GET /products/search
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(productPaginationSchema),
  controller.searchPaginated
);

// =================================================
// 2. ROTAS DE VARIAÇÕES (CRUD Direto)
// =================================================

router.post(
  "/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(createVariationSchema),
  controller.createVariation
);

router.get(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(productIdSchema), // Reutilizando schema de ID genérico
  controller.getVariationById
);

router.patch(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(updateVariationSchema),
  controller.updateVariation
);

router.delete(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(productIdSchema),
  controller.deleteVariation
);

// =================================================
// 3. ROTAS ANINHADAS (Produto -> Variações)
// =================================================

// Busca variações de um produto (ID no Param + Page/Limit na Query)
router.get(
  "/:id/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(productNestedPaginationSchema),
  controller.getPaginatedProductVariations
);

router.get(
  "/:id/variations/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(productNestedPaginationSchema),
  controller.searchProductVariations
);

// =================================================
// 4. ROTAS DE PRODUTO ESPECÍFICO (CRUD pelo ID)
// =================================================

router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(createProductSchema),
  controller.createProduct
);

router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  validate(productIdSchema),
  controller.getProductById
);

router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  validate(updateProductSchema),
  controller.updateProduct
);

router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  validate(productIdSchema),
  controller.deleteProduct
);

export default router;
