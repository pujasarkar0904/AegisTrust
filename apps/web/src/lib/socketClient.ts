import { io, type Socket } from "socket.io-client";
let socket: Socket | null = null;
export function socketClient(): Socket {
  if (!socket) socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", { autoConnect: true, reconnectionAttempts: 4, timeout: 5000 });
  return socket;
}
