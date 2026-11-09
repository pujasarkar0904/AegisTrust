import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const appDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(appDir, "../../.env") });
/** @type {import('next').NextConfig} */
const nextConfig = { transpilePackages: ["@aegistrust/core"] };
export default nextConfig;
