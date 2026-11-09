import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { config, isAllowedOrigin } from "../config.js";

export function createSocketBus(server: HttpServer) {
  const io = new Server(server, { cors: { origin: (origin, callback) => callback(null, isAllowedOrigin(origin)), methods: ["GET", "POST"] } });
  io.on("connection", socket => socket.emit("system:ready", { at: new Date().toISOString() }));
  return {
    io,
    publishThreat(payload: { domain: string; verdict: string; trustScore: number; scannedAt: string }) {
      io.emit("threat:new", payload);
    }
  };
}
