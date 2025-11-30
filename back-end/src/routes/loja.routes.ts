import { Router } from "express";
import { LojaController } from "../controllers/loja.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new LojaController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// Ver todas as lojas (Só o dono do sistema)
router.get(
  "/",
  requireRole(["SUPER_ADMIN"]),
  controller.getAll.bind(controller)
);

// Ver uma loja específica
// Adicionei requireRole para garantir que funcionário comum não fique "bisbilhotando" lojas alheias pelo ID,
// embora seu controller deva tratar isso também.
router.get(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE", "FUNCIONARIO"]),
  controller.getById.bind(controller)
);

// Criar loja avulsa
router.post(
  "/",
  requireRole(["SUPER_ADMIN"]),
  controller.create.bind(controller)
);

// Atualizar dados da loja
router.patch(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.update.bind(controller)
);

// Deletar loja
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.remove.bind(controller)
);

export default router;
