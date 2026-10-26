import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Les variables déjà définies (ex. en CI) ne sont pas écrasées.
config({ path: ".env.test", quiet: true });

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    // Une seule base partagée : on exécute les fichiers l'un après l'autre.
    fileParallelism: false,
  },
});
