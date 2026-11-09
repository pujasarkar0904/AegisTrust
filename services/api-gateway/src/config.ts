const jwtSecret = process.env.JWT_SECRET?.trim();
if (!jwtSecret || jwtSecret === "REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS" || jwtSecret.length < 32) {
  throw new Error("Set JWT_SECRET to at least 32 random characters in the root .env file before starting the API.");
}
export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  bindHost: process.env.BIND_HOST ?? "127.0.0.1",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  extensionOrigins: (process.env.EXTENSION_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  reconUrl: process.env.RECON_WORKER_URL ?? "http://localhost:4101",
  sandboxUrl: process.env.SANDBOX_WORKER_URL ?? "http://localhost:4102",
  cleanTtlSeconds: Number(process.env.CACHE_CLEAN_SECONDS ?? 900),
  jwtSecret
};
export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (origin === config.webOrigin || config.extensionOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && origin.startsWith("chrome-extension://");
}
