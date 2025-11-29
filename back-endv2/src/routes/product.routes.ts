// src/routes/product.routes.ts
import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new ProductController();

router.use(authMiddleware);

// --- LEITURA (Paginada e Busca) ---
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getPaginated.bind(controller)
);
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.searchPaginated.bind(controller)
);

// --- VARIAÇÕES (CRUD) ---

router.post(
  "/variations",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.createVariation.bind(controller)
);
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

// --- PRODUTOS (CRUD) ---
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
