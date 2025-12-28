// src/server.ts
import app from "./app";
import { prisma } from "../shared/database/prisma"; // Cliente Prisma

const PORT = process.env.PORT || 3333;

// Conecta ao banco de dados e inicia o servidor
async function startServer() {
  try {
    console.log("Iniciando a conexão com o banco de dados.");
    await prisma.$connect();
    console.log("✅ Bando de dados e Prisma conectados com sucesso!");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}\n`);
      console.log(
        `Link de teste do servidor: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1); // Sai do processo em caso de erro
  }
}

startServer();
