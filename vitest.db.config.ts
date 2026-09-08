import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Suite de integracao: exige `npx supabase start` rodando (Postgres local
// com as migrations de supabase/migrations aplicadas). Nunca aponta para o
// projeto remoto. Rodar com `npm run test:db`.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    setupFiles: ["./tests/db/setup-env.ts"],
  },
});
