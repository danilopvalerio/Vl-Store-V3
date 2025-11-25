// src/routes/index.ts
import { Router } from "express";
import userRoutes from "./user.routes";
import lojaRoutes from "./loja.routes";
import userProfileRoutes from "./user_profile.routes";

const router = Router();

// 🔥 Rota simples só para testar que o servidor está de pé
router.get("/health", (req, res) => {
  return res.json({ status: "ok", message: "API funcionando 🚀" });
});

router.use("/users", userRoutes);
router.use("/lojas", lojaRoutes);
router.use("/profiles", userProfileRoutes);

export default router;
