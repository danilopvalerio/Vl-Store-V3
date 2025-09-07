import { Router } from "express";
import { VendaController } from "../controllers/VendaController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ensureAdmin } from "../middlewares/ensureAdmin";

const vendaRoutes = Router();
const vendaController = new VendaController();

vendaRoutes.use(authMiddleware);

vendaRoutes.post("/", vendaController.create);

vendaRoutes.get("/loja/paginated", vendaController.findPaginatedByLoja);
vendaRoutes.get("/loja/search", vendaController.searchPaginatedByLoja);

vendaRoutes.get(
  "/caixa/:idCaixa/paginated",
  vendaController.findPaginatedByCaixa
);
// Poderia existir também uma rota de busca por caixa
// vendaRoutes.get("/caixa/:idCaixa/search", vendaController.searchPaginatedByCaixa);

vendaRoutes.get("/:id_venda", vendaController.findById);
vendaRoutes.delete("/:id_venda/cancel", ensureAdmin, vendaController.cancel);

export default vendaRoutes;
