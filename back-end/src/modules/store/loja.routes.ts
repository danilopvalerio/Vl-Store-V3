import { Router } from "express";
import { LojaController } from "./loja.controller";
import { LojaService } from "./loja.service";
import { LojaRepository } from "./loja.repository";
import { LogService } from "../logs/log.service";
import {
  AccessLogRepository,
  SystemLogRepository,
} from "../logs/log.repository"; // <--- Importe os repositórios
import {
  authMiddleware,
  requireRole,
} from "../../app/middleware/auth.middleware";

const router = Router();

// ============================================================================
// INJEÇÃO DE DEPENDÊNCIA
// ============================================================================

// 1. Instancia as dependências do LogService
const accessLogRepo = new AccessLogRepository();
const systemLogRepo = new SystemLogRepository();
const logService = new LogService(accessLogRepo, systemLogRepo);

// 2. Instancia as dependências do LojaService
const repository = new LojaRepository();
const service = new LojaService(repository, logService);
const controller = new LojaController(service);

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// Ver todas as lojas (Só o dono do sistema)
router.get("/", requireRole(["SUPER_ADMIN"]), controller.getAll);

// Ver uma loja específica
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getById
);

// Criar loja avulsa
router.post("/", requireRole(["SUPER_ADMIN"]), controller.create);

// Atualizar dados da loja
router.patch("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), controller.update);

// Deletar loja
router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN"]), controller.remove);

export default router;
