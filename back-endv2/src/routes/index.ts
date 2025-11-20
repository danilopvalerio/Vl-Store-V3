// src/routes/index.ts
import { Router } from "express";
import userRoutes from "./user.routes";

const router = Router();

// 🔥 Rota simples só para testar que o servidor está de pé
router.get("/health", (req, res) => {
  return res.json({ status: "ok", message: "API funcionando 🚀" });
});

router.use("/users", userRoutes);

export default router;
