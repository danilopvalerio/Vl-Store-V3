// src/routes/loja.routes.ts
import { Router } from "express";
import { LojaController } from "../controllers/loja.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new LojaController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// Apenas SUPER_ADMIN deveria ver todas as lojas do sistema
router.get(
  "/",
  requireRole(["SUPER_ADMIN"]),
  controller.getAll.bind(controller)
);

// ADMIN (Dono) pode ver sua própria loja via ID (ou o middleware filtra depois)
router.get("/:id", controller.getById.bind(controller));

// Criar loja avulsa (Sem usuário atrelado automaticamente) - Restrito a SUPER_ADMIN
router.post(
  "/",
  requireRole(["SUPER_ADMIN"]),
  controller.create.bind(controller)
);

// Atualizar dados da loja (Nome, CNPJ) - Apenas o Dono (ADMIN)
router.patch(
  "/:id",
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  controller.update.bind(controller)
);

// Deletar loja - Perigoso, restrito a SUPER_ADMIN ou ADMIN (Dono)
router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.remove.bind(controller)
);

export default router;
