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
convex.onUpdate(api.computers.internalList, {}, (computers: any[]) => {
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
      const socketTyped = socket as any; // Temporary cast for custom props
      if (socketTyped.isBlocked !== isBlocked) {
        console.log(`[${new Date().toISOString()}] Toggling block state for: ${computer.name} (${computer.id}) to ${isBlocked}`);
        socketTyped.isBlocked = isBlocked;
        socket.emit("setBlocked", isBlocked);
      }
    }
  }
});

io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] Socket connected: ${socket.id}`);

  let computerId: string | undefined; // Declare computerId here to be accessible by all handlers for this socket

  socket.on("registerComputer", async (data) => {
    console.log(`[${new Date().toISOString()}] Registering computer: ${data.name} (${data.id}) on ${data.os} (Org: ${data.orgId})`);
    try {
      // Security: Validate Org ID exists before proceding
      const orgCheck = await convex.query(api.computers.validateOrg, { id: data.orgId });
      if (!orgCheck.isValid) {
        console.warn(`[${new Date().toISOString()}] REJECTED registration for ${data.id}: Invalid Org ID ${data.orgId}`);
        socket.disconnect(true);
        return;
      }

      const result = await convex.mutation(api.computers.register, {
        id: data.id,
        name: data.name,
        os: data.os,
        orgId: data.orgId,
      }) as { isBlocked: boolean };
      
      console.log(`[${new Date().toISOString()}] Registration successful for: ${data.id}. Block status: ${result.isBlocked}`);
      
      // Store computerId, orgId, and block state for this socket
      computerId = data.id;
      (socket as any).computerId = data.id;
      (socket as any).orgId = data.orgId;
      (socket as any).isBlocked = result.isBlocked;
      activeSockets.set(data.id, socket);

      // Immediately apply block state if needed (handshake/offline-first)
      if (result.isBlocked) {
        console.log(`[${new Date().toISOString()}] Immediately blocking computer per registration handshake: ${data.id}`);
        socket.emit("setBlocked" as any, true);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Registration failed for ${data.id}:`, error);
    }
  });

  socket.on("validateOrg", async (data: { orgId: string }, callback: (res: { isValid: boolean }) => void) => {
    try {
      const result = await convex.query(api.computers.validateOrg, { id: data.orgId });
      callback(result);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Org validation failed:`, error);
      callback({ isValid: false });
    }
  });

  socket.on("heartbeat", async () => {
    if (computerId) {
      const orgId = (socket as any).orgId;
      // console.log(`[${new Date().toISOString()}] Heartbeat from: ${computerId}`);
      try {
        await convex.mutation(api.computers.heartbeat, { id: computerId, orgId });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Heartbeat failed for ${computerId}:`, error);
      }
    }
  });

  socket.on("launchSurvey", async (data: { surveyId: string, targets: string[] }) => {
    console.log(`[${new Date().toISOString()}] RECEIVED launchSurvey for ${data.surveyId}. Targets: ${data.targets.length}`);
    
    for (const targetId of data.targets) {
      const targetSocket = activeSockets.get(targetId);
      if (targetSocket) {
        console.log(`[${new Date().toISOString()}] ROUTING surveyLaunch to ${targetId} (Socket: ${targetSocket.id})`);
        targetSocket.emit("surveyLaunch", { surveyId: data.surveyId });
      } else {
        console.warn(`[${new Date().toISOString()}] SKIPPING ${targetId}: No active socket found`);
      }
    }
  });

  socket.on("setSurveying", async (isSurveying: boolean) => {
    const computerId = (socket as any).computerId;
    const orgId = (socket as any).orgId;
    if (computerId && orgId) {
      console.log(`[${new Date().toISOString()}] Survey status changed for ${computerId}: ${isSurveying}`);
      try {
        await convex.mutation(api.computers.setSurveying, { 
          id: computerId, 
          orgId, 
          isSurveying 
        });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to set surveying for ${computerId}:`, error);
      }
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
