import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  const result = config({ path: envPath, override: true, quiet: true });
  if (result.error) {
    console.warn(`[env] Failed to load ${envPath}: ${result.error.message}`);
  }
}
