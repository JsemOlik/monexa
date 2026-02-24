import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@monexa/types";
import { type as getOsType, hostname as getHostname } from "@tauri-apps/plugin-os";

const SERVER_URL = "http://localhost:3001";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
  path: "/client",
  auth: async (cb) => {
    const orgId = localStorage.getItem("monexa_org_id");
    const hostname = (await getHostname()) ?? "unknown-host";
    cb({ computerId: hostname, orgId });
  }
});

export async function initSocket() {
  try {
    console.log("Initializing socket...");
    const os = (await getOsType()) ?? "unknown";
    const hostname = (await getHostname()) ?? "unknown-host";
    console.log(`OS: ${os}, Hostname: ${hostname}`);

    socket.on("connect", () => {
      console.log("[SOCKET] Connected to server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });

    socket.connect();
    console.log("Socket connect() called");
  } catch (error) {
    console.error("Failed to initialize socket:", error);
  }
}
