import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => console.log("Conectado a PostgreSQL con Prisma En Neon"))
  .catch((err) => console.error("Error al conectar con Prisma:", err));

export { prisma };