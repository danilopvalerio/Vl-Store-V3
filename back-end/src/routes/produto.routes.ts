// src/routes/Produto.routes.ts

import { Router } from "express";
import { ProdutoController } from "../controllers/ProdutoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ensureAdmin } from "../middlewares/ensureAdmin";

const produtoRoutes = Router();
const produtoController = new ProdutoController();

produtoRoutes.use(authMiddleware);

produtoRoutes.post("/", ensureAdmin, produtoController.create);

produtoRoutes.get("/", produtoController.findAll);

produtoRoutes.get("/paginated", produtoController.findPaginated);

produtoRoutes.get("/search", produtoController.search);

produtoRoutes.get("/:referencia", produtoController.findById);

produtoRoutes.patch("/:referencia", ensureAdmin, produtoController.update);

produtoRoutes.delete("/:referencia", ensureAdmin, produtoController.delete);

export default produtoRoutes;
