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
import { validate } from "../../app/middleware/validation.middleware"; // <--- Middleware
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
} from "./session.schema"; // <--- Schemas

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

// Registro de Nova Loja + Dono
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  controller.register
);

// Login (Gera Tokens)
router.post("/login", authLimiter, validate(loginSchema), controller.login);

// Renovação de Token
router.post("/refresh", validate(refreshTokenSchema), controller.refresh);

// Logout (Invalida Refresh Token)
// Geralmente espera o refreshToken no body para invalidá-lo no banco
router.post("/logout", validate(refreshTokenSchema), controller.logout);

export default router;
