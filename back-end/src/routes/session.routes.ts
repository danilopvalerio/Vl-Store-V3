import { Router } from "express";
import { SessionController } from "../controllers/SessionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ensureAdmin } from "../middlewares/ensureAdmin";

// Instancia o controlador de sessão e o roteador
const sessionRoutes = Router();
const controller = new SessionController();

// --- DEFINIÇÃO DAS ROTAS DE SESSÃO ---

// Rota para criar uma nova sessão (login)
// Ex: POST /api/sessions
sessionRoutes.post("/", controller.create);

// Rota para atualizar o access token usando o refresh token
// Ex: POST /api/sessions/refresh
sessionRoutes.post("/refresh", controller.refresh);

// Rota para invalidar uma sessão (logout)
// Ex: DELETE /api/sessions/logout
sessionRoutes.delete("/logout", controller.logout);

// Rota para obter os dados do perfil da loja autenticada
// Requer autenticação via authMiddleware
// Ex: GET /api/sessions/profile
sessionRoutes.get("/profile", authMiddleware, controller.profile);

export default sessionRoutes;
