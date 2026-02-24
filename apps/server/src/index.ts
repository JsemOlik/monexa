import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { ConvexClient } from "convex/browser";
import { api } from "../../web/convex/_generated/api";
import type { ClientToServerEvents, ServerToClientEvents } from "@monexa/types";

const CONVEX_URL = process.env.CONVEX_URL || "https://affable-peacock-307.eu-west-1.convex.cloud";
const convex = new ConvexClient(CONVEX_URL);

// Map to track active sockets by computer ID
const activeSockets = new Map<string, Socket>();

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" },
  path: "/client",
});

// Subscribe to computer changes in Convex
convex.onUpdate(api.computers.list, {}, (computers) => {
  for (const computer of computers) {
    const socket = activeSockets.get(computer.id);
    if (socket) {
      // Handle physical disconnection if marked offline
      if (computer.status === "offline") {
        console.log(`[${new Date().toISOString()}] Forcefully disconnecting computer: ${computer.name} (${computer.id})`);
        socket.disconnect(true);
        activeSockets.delete(computer.id);
        continue;
      }

      // Handle real-time blocking
      const isBlocked = !!computer.isBlocked;
      if ((socket as any).isBlocked !== isBlocked) {
        console.log(`[${new Date().toISOString()}] Toggling block state for: ${computer.name} (${computer.id}) to ${isBlocked}`);
        (socket as any).isBlocked = isBlocked;
        socket.emit("setBlocked" as any, isBlocked);
      }
    }
  }
});

io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] Socket connected: ${socket.id}`);

  socket.on("registerComputer", async (data) => {
    console.log(`[${new Date().toISOString()}] Registering computer: ${data.name} (${data.id}) on ${data.os}`);
    try {
      await convex.mutation(api.computers.register, {
        id: data.id,
        name: data.name,
        os: data.os,
      });
      console.log(`[${new Date().toISOString()}] Registration successful for: ${data.id}`);
      
      // Store socket for disconnect handling
      (socket as any).computerId = data.id;
      activeSockets.set(data.id, socket);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Registration failed for ${data.id}:`, error);
    }
  });

  socket.on("disconnect", async (reason) => {
    const computerId = (socket as any).computerId;
    console.log(`[${new Date().toISOString()}] Socket disconnected: ${socket.id} (Reason: ${reason})`);
    if (computerId) {
      activeSockets.delete(computerId);
      console.log(`[${new Date().toISOString()}] Setting computer offline: ${computerId}`);
      try {
        await convex.mutation(api.computers.setOffline, { id: computerId });
        console.log(`[${new Date().toISOString()}] Successfully set offline: ${computerId}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to set offline for ${computerId}:`, error);
      }
    }
  });
});

httpServer.listen(3001, () => {
  console.log("Server running on port 3001");
});
