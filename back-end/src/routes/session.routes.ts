// src/routes/session.routes.ts
import { Router } from "express";
import { SessionController } from "../controllers/SessionController";

const sessionRoutes = Router();
const controller = new SessionController();

sessionRoutes.post("/", controller.create); // /api/sessions
sessionRoutes.post("/refresh", controller.refresh); // /api/sessions/refresh
sessionRoutes.delete("/", controller.logout); // /api/sessions

export default sessionRoutes;
