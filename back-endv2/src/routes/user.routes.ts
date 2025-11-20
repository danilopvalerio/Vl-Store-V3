// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();
const controller = new UserController();

router.post("/", controller.create.bind(controller)); // POST /api/users
router.post("/login", controller.login.bind(controller)); // POST /api/users/login
router.get("/", controller.getAll.bind(controller)); // GET /api/users
router.get("/paginated", controller.getPaginated.bind(controller)); // GET /api/users/paginated?page=1&perPage=10
router.get("/search", controller.searchPaginated.bind(controller)); // GET /api/users/search?q=nome&page=1&perPage=10
router.get("/:id", controller.getById.bind(controller)); // GET /api/users/:id
router.patch("/:id", controller.update.bind(controller)); // PATCH /api/users/:id
router.delete("/:id", controller.remove.bind(controller)); // DELETE /api/users/:id

export default router;
