import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const parentEnv = resolve(process.cwd(), "../../.env");
dotenv.config({ path: existsSync(parentEnv) ? parentEnv : resolve(process.cwd(), ".env") });
