import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  path: "/client",
});

socket.on("connect", () => {
  console.log("[SOCKET] Dashboard connected to server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("[SOCKET] Dashboard connection error:", err.message);
});
