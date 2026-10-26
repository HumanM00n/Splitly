import { execSync } from "node:child_process";

/** Vérifie qu'on vise bien une base de test, puis applique les migrations. */
export default function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL n'est pas défini (voir .env.test.example).");
  }
  const databaseName = new URL(url).pathname.slice(1);
  if (!databaseName.includes("test")) {
    throw new Error(
      `Refus de lancer les tests sur « ${databaseName} » : le nom de la base doit contenir "test" (elle est vidée par les tests).`,
    );
  }

  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}
