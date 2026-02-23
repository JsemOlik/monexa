import { createServer } from "http";
import { Server } from "socket.io";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../web/convex/_generated/api";
import type { ClientToServerEvents, ServerToClientEvents } from "@monexa/types";

const CONVEX_URL = process.env.CONVEX_URL || "https://affable-peacock-307.eu-west-1.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" },
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
      
      // Store id on socket for disconnect handling
      (socket as any).computerId = data.id;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Registration failed for ${data.id}:`, error);
    }
  });

  socket.on("disconnect", async (reason) => {
    const computerId = (socket as any).computerId;
    console.log(`[${new Date().toISOString()}] Socket disconnected: ${socket.id} (Reason: ${reason})`);
    if (computerId) {
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
