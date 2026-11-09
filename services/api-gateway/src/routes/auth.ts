import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "@aegistrust/db/client";
import { users } from "@aegistrust/db/schema";
import { config } from "../config.js";

export const authRouter: ReturnType<typeof Router> = Router();
const credentials = z.object({ email: z.string().email().max(255).transform(v => v.toLowerCase()), password: z.string().min(12).max(128) });
authRouter.post("/register", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Use a valid email and a password of at least 12 characters." });
  try {
    const hash = await bcrypt.hash(parsed.data.password, 12);
    const [user] = await db.insert(users).values({ email: parsed.data.email, passwordHash: hash }).returning({ id: users.id, email: users.email, reputationScore: users.reputationScore });
    const token = jwt.sign({ sub: user.id, email: user.email, reputation: user.reputationScore }, config.jwtSecret, { expiresIn: "8h", issuer: "aegistrust" });
    return res.status(201).json({ token, user });
  } catch { return res.status(409).json({ error: "That account may already exist, or the database is unavailable." }); }
});
authRouter.post("/login", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password." });
  try {
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
    const token = jwt.sign({ sub: user.id, email: user.email, reputation: user.reputationScore }, config.jwtSecret, { expiresIn: "8h", issuer: "aegistrust" });
    return res.json({ token, user: { id: user.id, email: user.email, reputationScore: user.reputationScore } });
  } catch { return res.status(503).json({ error: "Authentication service is unavailable." }); }
});
