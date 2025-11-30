import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new ProductController();

router.use(authMiddleware);

// =================================================
// 1. ROTAS GERAIS DE PRODUTO (Sem ID na URL)
// =================================================

// GET /products/paginated
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getPaginated.bind(controller)
);

// GET /products/search
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.searchPaginated.bind(controller)
);

// =================================================
// 2. ROTAS DE VARIAÇÕES (CRUD Direto)
// =================================================
// Estas rotas lidam com a variação diretamente pelo ID dela ou criam novas

router.post(
  "/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.createVariation.bind(controller)
);

// Rotas que usam o ID da variação
router.get(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getVariationById.bind(controller)
);

router.patch(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.updateVariation.bind(controller)
);

router.delete(
  "/variations/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.deleteVariation.bind(controller)
);

// =================================================
// 3. ROTAS ANINHADAS (Produto -> Variações)
// =================================================
// *IMPORTANTE*: Estas rotas devem vir ANTES de router.get("/:id")
// URL Final: /products/:id/variations

router.get(
  "/:id/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getPaginatedProductVariations.bind(controller)
);

router.get(
  "/:id/variations/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.searchProductVariations.bind(controller)
);

// =================================================
// 4. ROTAS DE PRODUTO ESPECÍFICO (CRUD pelo ID)
// =================================================
// Deixe estas por último para o Express não confundir ":id" com "paginated" etc.

router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.createProduct.bind(controller)
);

router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getProductById.bind(controller)
);

router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.updateProduct.bind(controller)
);

router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.deleteProduct.bind(controller)
);

export default router;
