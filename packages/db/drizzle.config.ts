import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";
dotenv.config({ path: resolve(process.cwd(), "../../.env") });
export default defineConfig({
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://aegis:aegis_local_only@localhost:5432/aegistrust" },
  out: "./drizzle"
});
