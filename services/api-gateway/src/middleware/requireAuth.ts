import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: "Sign in to use this endpoint." });
  try {
    jwt.verify(match[1]!, config.jwtSecret, { issuer: "aegistrust", algorithms: ["HS256"] });
    return next();
  } catch {
    return res.status(401).json({ error: "Your session expired. Sign in again." });
  }
};
