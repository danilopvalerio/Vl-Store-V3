//src/shared/database/prisma.ts
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";

export const prisma = new PrismaClient();
