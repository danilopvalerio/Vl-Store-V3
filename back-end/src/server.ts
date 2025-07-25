// Arquivo de configuração do servidor da API

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import "reflect-metadata"; // Necessário para o TypeORM
import { AppDataSource } from "./database/data-source";
import routes from "./routes"; // Importa nosso roteador principal

// Inicializa a conexão com o banco de dados
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Fonte de Dados inicializada com sucesso!");

    const app = express();
    const PORT = process.env.PORT || 3333;

    // Middleware para o Express entender JSON
    app.use(express.json());
    // Middleware para guardar o JWT nos Cookies (HttpOnly, Secure, SameSite)
    app.use(cookieParser());

    // Middleware para usar nossas rotas com o prefixo /api
    app.use("/api", routes);

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro durante a inicialização da Fonte de Dados:", err);
  });
