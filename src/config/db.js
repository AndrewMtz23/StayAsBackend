import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

prisma
  .$connect()
  .then(() => console.log("Conectado a PostgreSQL con Prisma (adapter-pg)"))
  .catch((err) => console.error("Error al conectar con Prisma:", err));

export { prisma };
