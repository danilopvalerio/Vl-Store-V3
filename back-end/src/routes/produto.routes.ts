// src/routes/Produto.routes.ts

import { Router } from "express";
import { ProdutoController } from "../controllers/ProdutoController";
import { authMiddleware } from "../middlewares/authMiddleware";

const produtoRoutes = Router();
const produtoController = new ProdutoController();

// Aplica o middleware de autenticação a todas as rotas de produto
produtoRoutes.use(authMiddleware);

// Rota para criar um produto
produtoRoutes.post("/", produtoController.create);

// Rota para retornar todos os produtos da loja do usuário
produtoRoutes.get("/", produtoController.findAll);

// Rota para buscar produtos de forma paginada
// IMPORTANTE: Esta rota deve vir ANTES da rota /:referencia para não haver conflito.
produtoRoutes.get("/paginated", produtoController.findPaginated);

// O parâmetro da rota foi corrigido para ':referencia'
// para corresponder ao que o controller e o serviço esperam.
produtoRoutes.get("/:referencia", produtoController.findById);

// Parâmetro corrigido para ':referencia'
produtoRoutes.patch("/:referencia", produtoController.update);

// Parâmetro corrigido para ':referencia'
produtoRoutes.delete("/:referencia", produtoController.delete);

export default produtoRoutes;
