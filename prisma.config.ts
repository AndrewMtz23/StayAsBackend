import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
    // Si usas migrate dev y te lo llega a pedir:
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
