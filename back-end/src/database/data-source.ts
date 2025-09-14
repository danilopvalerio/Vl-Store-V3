import "dotenv/config";
import { DataSource } from "typeorm";

const entitiesDev = ["src/models/*.ts"];
const entitiesProd = ["dist/models/*.js"];

const migrationsDev = ["src/database/migrations/*.ts"];
const migrationsProd = ["dist/database/migrations/*.js"];

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL, // ← aqui vai a External Database URL do Render
  ssl: {
    rejectUnauthorized: false, // necessário para alguns bancos cloud
  },
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: process.env.NODE_ENV === "development" ? entitiesDev : entitiesProd,
  migrations:
    process.env.NODE_ENV === "development" ? migrationsDev : migrationsProd,
});
