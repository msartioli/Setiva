import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Carrega .env.test.local sem depender de um pacote externo. So preenche
// variaveis que ainda nao existem no ambiente (nao sobrescreve).
const envPath = resolve(process.cwd(), ".env.test.local");

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
