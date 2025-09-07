import { Router } from "express";
import { MovimentacaoController } from "../controllers/MovimentacaoController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ensureAdmin } from "../middlewares/ensureAdmin";

const movimentacaoRoutes = Router();
const controller = new MovimentacaoController();

movimentacaoRoutes.use(authMiddleware);

movimentacaoRoutes.post("/", controller.create);
movimentacaoRoutes.get("/loja/paginated", controller.findPaginatedByLoja);
movimentacaoRoutes.get("/loja/search", controller.searchPaginatedByLoja);
// Adicionar rotas para buscar por caixa se necessário
movimentacaoRoutes.delete("/:id_movimentacao", ensureAdmin, controller.delete);

export default movimentacaoRoutes;
