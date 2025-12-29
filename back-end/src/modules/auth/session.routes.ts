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
import { authMiddleware } from "../../app/middleware/auth.middleware"; // Importante
import { validate } from "../../app/middleware/validation.middleware";
import {
  loginSchema,
  registerSchema,
  selectStoreSchema, // Novo schema
  refreshTokenSchema,
} from "./session.schema";

const router = Router();

const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

const sessionRepo = new SessionRepository();
const userRepo = new UserRepository();

const service = new SessionService(sessionRepo, userRepo, logService);
const controller = new SessionController(service);

// --- ROTAS ---

// Registro
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  controller.register
);

// Login (Pode retornar token final OU lista de perfis)
router.post("/login", authLimiter, validate(loginSchema), controller.login);

// Seleção de Loja (Requer Token Pre-Auth gerado no Login)
router.post(
  "/select-store",
  authMiddleware, // Valida o token temporário
  validate(selectStoreSchema),
  controller.selectStore
);

// Renovação
router.post("/refresh", controller.refresh);

// Logout
router.post("/logout", validate(refreshTokenSchema), controller.logout);

router.get("/me/profiles", authMiddleware, controller.getProfiles);
export default router;
