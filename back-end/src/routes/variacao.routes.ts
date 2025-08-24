// src/routes/variacao.routes.ts

import { Router } from "express";
import { VariacaoController } from "../controllers/VariacaoController";
import { authMiddleware } from "../middlewares/authMiddleware";

const variacaoRoutes = Router();
const variacaoController = new VariacaoController();

// Aplica o middleware de autenticação a todas as rotas de variação
variacaoRoutes.use(authMiddleware);

// --- Rotas que agem diretamente sobre a coleção de variações ---

// Criar uma nova variação
variacaoRoutes.post("/", variacaoController.create);

// Listar todas as variações da loja do usuário autenticado
variacaoRoutes.get("/", variacaoController.findAllByLoja);

// --- Rotas que agem sobre uma variação específica por seu ID ---

// Buscar uma variação específica por ID
variacaoRoutes.get("/:id", variacaoController.findById);

// Atualizar uma variação
variacaoRoutes.patch("/:id", variacaoController.update);

// Deletar uma variação
variacaoRoutes.delete("/:id", variacaoController.delete);

// --- Rotas aninhadas sob produtos para listar suas variações ---
// NOTA: Para uma organização ideal, estas rotas poderiam ser adicionadas
// ao final do arquivo 'Produto.routes.ts', mas também funcionam aqui.

const produtoVariacaoRouter = Router();
produtoVariacaoRouter.use(authMiddleware);

// Listar todas as variações de um produto específico
produtoVariacaoRouter.get(
  "/produtos/:referencia/variacoes",
  variacaoController.findAllByProduto
);

// Listar variações de um produto com paginação
produtoVariacaoRouter.get(
  "/produtos/:referencia/variacoes/paginated",
  variacaoController.findPaginatedByLoja
);

export { variacaoRoutes, produtoVariacaoRouter };
