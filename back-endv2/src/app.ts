// src/app.ts

import "dotenv/config"; // Carrega variáveis de ambiente
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes"; // Todas as rotas do projeto
// import { errorHandler } from "./middlewares/errorHandler"; // Middleware de tratamento de erros

const app = express();

// --- MIDDLEWARES GLOBAIS ---
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, // Permite cookies
  })
);
app.use(express.json());
app.use(cookieParser());

// --- ROTAS ---
app.use("/api", routes);

// --- TRATAMENTO DE ERROS ---
// app.use(errorHandler);

export default app;
