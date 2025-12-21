import { Router } from "express";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { SessionRepository } from "./session.repository";
import { UserRepository } from "../user/user.repository";
import { LogService } from "../logs/log.service";
import {
  AccessLogRepository,
  SystemLogRepository,
} from "../logs/log.repository";
import { authLimiter } from "../../app/middleware/rateLimit.middleware";

const router = Router();

// 1. Instancia dependências de Logs
const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

// 2. Instancia dependências de Session
const sessionRepo = new SessionRepository();
const userRepo = new UserRepository();

// 3. Instancia Service e Controller
const service = new SessionService(sessionRepo, userRepo, logService);
const controller = new SessionController(service);

// --- ROTAS ---

// POST /api/auth/register (Cria Loja + Admin + User)
router.post("/register", authLimiter, controller.register);

// POST /api/auth/login (Gera Access + Refresh Token)
router.post("/login", authLimiter, controller.login);

// POST /api/auth/refresh (Renova o Access Token)
router.post("/refresh", controller.refresh);

// POST /api/auth/logout
router.post("/logout", controller.logout);

export default router;
