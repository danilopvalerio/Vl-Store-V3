// src/routes/index.ts
import { Router } from "express";
import sessionRoutes from "./../modules/auth/session.routes";
import userRoutes from "./../modules/user/user.routes";
import lojaRoutes from "./../modules/store/loja.routes";
import userProfileRoutes from "./../modules/user_profile/user_profile.routes";
import logRoutes from "./../modules/logs/log.routes";
import produtoRoutes from "./../modules/products/product.routes";
import caixaRoutes from "./../modules/cashier/caixa.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

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
