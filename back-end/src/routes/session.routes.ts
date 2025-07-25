import { Router } from "express";
import { SessionController } from "../controllers/SessionController";

const sessionRoutes = Router();
const sessionController = new SessionController();

// Qualquer requisição POST para a URL base ('/') desta rota,
// vai acionar o método 'create' do nosso controller.
sessionRoutes.post("/", sessionController.create);

export default sessionRoutes;
