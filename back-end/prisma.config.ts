import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Carregue o .env ANTES de qualquer coisa
dotenv.config();

console.log("🔥 PRISMA.CONFIG.TS FOI CARREGADO!");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // ← Singular mesmo
    url: env("DATABASE_URL"), // ← Use a função env() do Prisma
  },
});
