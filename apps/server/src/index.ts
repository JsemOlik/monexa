import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { ConvexClient } from "convex/browser";
import { api } from "../../web/convex/_generated/api";
import type { ClientToServerEvents, ServerToClientEvents } from "@monexa/types";

const CONVEX_URL = process.env.CONVEX_URL || "https://affable-peacock-307.eu-west-1.convex.cloud";
const convex = new ConvexClient(CONVEX_URL);

// Map to track active sockets by computer ID (Set for multiple windows)
const activeSockets = new Map<string, Set<Socket>>();

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" },
  path: "/client",
});

// Subscribe to computer changes in Convex
convex.onUpdate(api.computers.internalList, {}, (computers: any[]) => {
  for (const computer of computers) {
    const sockets = activeSockets.get(computer.id);
    if (sockets && sockets.size > 0) {
      // Handle physical disconnection if marked offline
      if (computer.status === "offline") {
        console.log(`[${new Date().toISOString()}] Forcefully disconnecting computer: ${computer.name} (${computer.id})`);
        for (const s of sockets) s.disconnect(true);
        activeSockets.delete(computer.id);
        continue;
      }

      // Handle real-time blocking
      const isBlocked = !!computer.isBlocked;
      // We can broadcast to the room for blocking
      io.to(computer.id).emit("setBlocked", isBlocked);
    }
  }
});

io.on("connection", async (socket) => {
  console.log(`[${new Date().toISOString()}] Socket connected: ${socket.id}`);

  // Immediate identification via handshake
  const { computerId: hsId, orgId: hsOrgId } = socket.handshake.auth as { computerId?: string, orgId?: string };
  let computerId: string | undefined = hsId;

  if (computerId && hsOrgId) {
    console.log(`[${new Date().toISOString()}] Handshake ID detected: ${computerId} (Org: ${hsOrgId})`);
    (socket as any).computerId = computerId;
    (socket as any).orgId = hsOrgId;
    
    socket.join(computerId);
    if (!activeSockets.has(computerId)) {
      activeSockets.set(computerId, new Set());
    }
    activeSockets.get(computerId)!.add(socket);
  }

  socket.on("registerComputer", async (data) => {
    console.log(`[${new Date().toISOString()}] Registering computer: ${data.name} (${data.id}) [Socket: ${socket.id}]`);
    try {
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

      console.log(`[${new Date().toISOString()}] Registration success for: ${data.id}. Blocked: ${result.isBlocked}`);

      computerId = data.id;
      (socket as any).computerId = data.id;
      (socket as any).orgId = data.orgId;
      (socket as any).isBlocked = result.isBlocked;
      
      // Join the computer-specific room
      socket.join(data.id);
      
      // Track in activeSockets
      if (!activeSockets.has(data.id)) {
        activeSockets.set(data.id, new Set());
      }
      activeSockets.get(data.id)!.add(socket);

      if (result.isBlocked) {
        socket.emit("setBlocked", true);
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
      try {
        await convex.mutation(api.computers.heartbeat, { id: computerId, orgId });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Heartbeat failed for ${computerId}:`, error);
      }
    }
  });

  // Called when admin launches a survey (prep/waiting mode)
  socket.on("launchSurvey", async (data: { surveyId: string; launchId: string; targets: string[] }) => {
    console.log(`[${new Date().toISOString()}] launchSurvey for ${data.surveyId}. Targets: ${data.targets.length}`);

    let surveyTitle = "Survey";
    let surveyStyle = "futuristic";
    try {
      const survey = await convex.query(api.surveys.getInternal, { id: data.surveyId as any });
      surveyTitle = survey?.title ?? "Survey";
      surveyStyle = survey?.style ?? "futuristic";
    } catch (_) {}

    for (const targetId of data.targets) {
      if (activeSockets.has(targetId)) {
        console.log(`[${new Date().toISOString()}] Broadcasting surveyLaunch to room ${targetId}`);
        io.to(targetId).emit("surveyLaunch", {
          surveyId: data.surveyId,
          launchId: data.launchId,
          surveyTitle,
          style: surveyStyle,
        });
      } else {
        console.warn(`[${new Date().toISOString()}] SKIPPING ${targetId}: No active sockets in room`);
      }
    }
  });

  // Called when admin cancels a pending survey
  socket.on("cancelSurvey", async (data: { launchId: string; targets: string[] }) => {
    console.log(`[${new Date().toISOString()}] cancelSurvey for launchId: ${data.launchId}. Targets: ${data.targets?.length ?? 0}`);
    if (!data.targets) return;

    for (const targetId of data.targets) {
      console.log(`[${new Date().toISOString()}] Broadcasting surveyCancel to room ${targetId}`);
      io.to(targetId).emit("surveyCancel", { launchId: data.launchId });
    }
  });

  // Called when admin clicks "Start" — computers show the actual questions
  socket.on("startSurvey", async (data: { launchId: string; survey: any; targets: string[] }) => {
    console.log(`[${new Date().toISOString()}] startSurvey for launchId: ${data.launchId}. Targets: ${data.targets?.length ?? 0}`);
    try {
      const { survey, targets, launchId } = data;
      if (!survey || !targets) return;

      for (const targetId of targets) {
        // Debug room membership
        const roomSockets = await io.in(targetId).fetchSockets();
        console.log(`[${new Date().toISOString()}] Room ${targetId} has ${roomSockets.length} socket(s) joined.`);
        
        if (roomSockets.length > 0) {
          console.log(`[${new Date().toISOString()}] Broadcasting surveyStart to room ${targetId}`);
          io.to(targetId).emit("surveyStart", {
            surveyId: survey._id,
            launchId: launchId,
            steps: survey.steps,
            style: survey.style ?? "futuristic",
          });
        } else {
          console.warn(`[${new Date().toISOString()}] Room ${targetId} is EMPTY. Fallback check activeSockets: ${activeSockets.has(targetId)}`);
          // Fallback: If room is empty for some reason, but we have sockets, force them to join
          const sockets = activeSockets.get(targetId);
          if (sockets) {
            console.log(`[${new Date().toISOString()}] FORCING ${sockets.size} sockets to join room ${targetId}`);
            for (const s of sockets) {
               s.join(targetId);
               s.emit("surveyStart", {
                  surveyId: survey._id,
                  launchId: launchId,
                  steps: survey.steps,
                  style: survey.style ?? "futuristic",
               });
            }
          }
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] startSurvey failed:`, error);
    }
  });

  // Called when a computer submits its survey responses
  socket.on("submitSurveyResponse", async (data: { launchId: string; surveyId: string; answers: { questionId: string; value: string }[] }) => {
    const cId = (socket as any).computerId;
    console.log(`[${new Date().toISOString()}] submitSurveyResponse from ${cId} [Socket: ${socket.id}]`);
    try {
      await convex.mutation(api.surveyResponses.submit, {
        launchId: data.launchId as any,
        surveyId: data.surveyId as any,
        computerHostname: cId ?? "unknown",
        answers: data.answers,
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to save response from ${cId}:`, error);
    }
  });

  socket.on("setSurveying", async (isSurveying: boolean) => {
    const cId = (socket as any).computerId;
    const orgId = (socket as any).orgId;
    if (cId && orgId) {
      try {
        await convex.mutation(api.computers.setSurveying, { id: cId, orgId, isSurveying });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to set surveying for ${cId}:`, error);
      }
    }
  });

  socket.on("disconnect", async (reason) => {
    const cId = (socket as any).computerId;
    console.log(`[${new Date().toISOString()}] Socket disconnected: ${socket.id} (Reason: ${reason})`);
    
    if (cId) {
      const sockets = activeSockets.get(cId);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          activeSockets.delete(cId);
          console.log(`[${new Date().toISOString()}] Last socket for ${cId} gone. Setting computer offline.`);
          try {
            const orgId = (socket as any).orgId;
            await convex.mutation(api.computers.setOffline, { id: cId, orgId });
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Failed to set offline for ${cId}:`, error);
          }
        } else {
          console.log(`[${new Date().toISOString()}] ${sockets.size} sockets still active for ${cId}`);
        }
      }
    }
  });
});

httpServer.listen(3001, () => {
  console.log("Server running on port 3001");
});
