// src/routes/index.ts
import { Router } from "express";
import sessionRoutes from "./session.routes";
import userRoutes from "./user.routes";
import lojaRoutes from "./loja.routes";
import userProfileRoutes from "./user_profile.routes";
import logRoutes from "./log.routes";
import produtoRoutes from "./product.routes";
import caixaRoutes from "./caixa.routes";
import dashboardRoutes from "./dashboard.routes";

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
router.use("/products", produtoRoutes);
router.use("/caixas", caixaRoutes);
router.use("/dashboard", dashboardRoutes);

// Rotas de Logs
router.use("/logs", logRoutes);

export default router;
