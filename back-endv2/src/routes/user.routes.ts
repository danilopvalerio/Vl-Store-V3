// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new UserController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// Criar usuário avulso (Geralmente usado pelo ADMIN para criar Funcionário)
router.post(
  "/",
  requireRole(["ADMIN", "GERENTE"]),
  controller.create.bind(controller)
);

// Listagem (Apenas ADMIN ou SUPER_ADMIN deve ver todos)
router.get(
  "/",
  requireRole(["SUPER_ADMIN"]),
  controller.getAll.bind(controller)
);

router.get("/", controller.getAll.bind(controller));

// Paginação e Busca
router.get(
  "/paginated",
  requireRole(["ADMIN", "GERENTE"]),
  controller.getPaginated.bind(controller)
);
router.get(
  "/search",
  requireRole(["ADMIN", "GERENTE"]),
  controller.searchPaginated.bind(controller)
);

// Operações por ID
router.get("/:id", controller.getById.bind(controller)); // O próprio usuário pode ver seu ID (lógica de "me" pode ser add depois)
router.patch("/:id", controller.update.bind(controller)); // Update (Senha/Email)
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  controller.remove.bind(controller)
); // Apenas ADMIN deleta

export default router;
