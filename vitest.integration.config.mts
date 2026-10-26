import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Les variables déjà définies (ex. en CI) ne sont pas écrasées.
config({ path: ".env.test", quiet: true });

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    // Une seule base partagée : on exécute les fichiers l'un après l'autre.
    fileParallelism: false,
  },
});
