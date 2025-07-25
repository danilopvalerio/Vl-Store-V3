import { Router } from "express";
import { LojaController } from "../controllers/LojaController";
import { authMiddleware } from "../middlewares/authMiddleware"; // <-- Importe o middleware

const lojaRoutes = Router();
const lojaController = new LojaController();

// Rota pública para criar uma loja
lojaRoutes.post("/", lojaController.create);

// Rota para retornar todas as lojas
lojaRoutes.get("/", lojaController.findAll);

// Rota estática específica primeiro
lojaRoutes.get("/perfil", authMiddleware, (request, response) => {
  return response.json({ message: "Você está em uma rota protegida!" });
});

// Rota protegida. O middleware é executado ANTES do controller.
// Se o token não for válido, o middleware barra a requisição.
lojaRoutes.get("/:id", authMiddleware, lojaController.findById);

lojaRoutes.patch("/:id", authMiddleware, lojaController.update);

lojaRoutes.delete("/:id", authMiddleware, lojaController.delete);

export default lojaRoutes;
