// src/routes/session.routes.ts
import { Router } from "express";
import { SessionController } from "../controllers/session.controller";

const router = Router();
const controller = new SessionController();

// POST /api/auth/register (Cria Loja + Admin + User)
router.post("/register", controller.register.bind(controller));

// POST /api/auth/login (Gera Access + Refresh Token)
router.post("/login", controller.login.bind(controller));

// POST /api/auth/refresh (Renova o Access Token)
router.post("/refresh", controller.refresh.bind(controller));

// POST /api/auth/logout
router.post("/logout", controller.logout.bind(controller));

export default router;
