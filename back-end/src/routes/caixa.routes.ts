import { Router } from "express";
import { CaixaController } from "../controllers/CaixaController";
import { authMiddleware } from "../middlewares/authMiddleware";

const caixaRoutes = Router();
const caixaController = new CaixaController();

// Todas as rotas de caixa requerem autenticação
caixaRoutes.use(authMiddleware);

// --- Ações principais ---
caixaRoutes.post("/open", caixaController.open);
caixaRoutes.post("/close/:id_caixa", caixaController.close);
caixaRoutes.delete("/:id_caixa", caixaController.delete);

// --- Consultas ---
caixaRoutes.get("/search", caixaController.searchByLoja);
caixaRoutes.get("/paginated", caixaController.findPaginatedByLoja);
caixaRoutes.get("/all", caixaController.findAllByLoja);
caixaRoutes.get("/my-open", caixaController.findMyOpenCaixa);

// Consulta genérica por id ---
caixaRoutes.get("/:id_caixa", caixaController.findById);

export default caixaRoutes;
