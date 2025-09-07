/**
 * src/database/data-source.ts
 *
 * Configuração central do TypeORM para a conexão com o banco de dados.
 */

import "dotenv/config";
import { DataSource } from "typeorm";

// Paths literais para entidades e migrations
const entitiesDev = ["src/models/*.ts"];
const entitiesProd = ["dist/models/*.js"];

const migrationsDev = ["src/database/migrations/*.ts"];
const migrationsProd = ["dist/database/migrations/*.js"];

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: false,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",

  // Strings literais diretas, não variáveis
  entities: process.env.NODE_ENV === "development" ? entitiesDev : entitiesProd,
  migrations:
    process.env.NODE_ENV === "development" ? migrationsDev : migrationsProd,
});
