import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const controller = new UserController();

// --- TODAS AS ROTAS ABAIXO EXIGEM TOKEN ---
router.use(authMiddleware);

// Criar usuário avulso
router.post(
  "/",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.create.bind(controller)
);

// Listagem Geral
// Apenas SUPER_ADMIN deve ver todos os usuários do banco (de todas as lojas)
router.get(
  "/",
  requireRole(["SUPER_ADMIN"]),
  controller.getAll.bind(controller)
);

// ⚠️ ATENÇÃO: Removi a linha duplicada 'router.get("/", ...)' que estava aqui sem proteção.
// Se você deixasse ela, qualquer pessoa logada veria todos os usuários.

// Paginação e Busca
router.get(
  "/paginated",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.getPaginated.bind(controller)
);
router.get(
  "/search",
  requireRole(["SUPER_ADMIN", "ADMIN", "GERENTE"]),
  controller.searchPaginated.bind(controller)
);

// Operações por ID
// Todos logados podem ver usuários (pelo ID), mas deletar é restrito
router.get("/:id", controller.getById.bind(controller));
router.patch("/:id", controller.update.bind(controller));

router.delete(
  "/:id",
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  controller.remove.bind(controller)
);

export default router;
