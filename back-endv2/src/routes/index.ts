// src/routes/index.ts
import { Router } from "express";
import sessionRoutes from "./session.routes";
import userRoutes from "./user.routes";
import lojaRoutes from "./loja.routes";
import userProfileRoutes from "./user_profile.routes";

const router = Router();

// Rota de saúde
router.get("/health", (req, res) => {
  return res.json({ status: "ok", message: "API funcionando 🚀" });
});

// Rotas de Autenticação (Públicas)
router.use("/auth", sessionRoutes);

// Rotas de Negócio (Protegidas internamente)
router.use("/users", userRoutes);
router.use("/lojas", lojaRoutes);
router.use("/profiles", userProfileRoutes);

export default router;
