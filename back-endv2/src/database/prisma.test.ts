import { prisma } from "./prisma";

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("Prisma conectado com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar com o Prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
