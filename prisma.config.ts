import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env (et non env()) pour que `prisma generate` fonctionne sans base configurée
    url: process.env.DATABASE_URL,
  },
});
