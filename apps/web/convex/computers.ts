import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const register = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    os: v.string(),
    orgId: v.optional(v.string()), // Make optional for robustness during migration
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        os: args.os,
        status: "online",
        lastSeen: Date.now(),
        // Only update orgId if provided, don't wipe it
        ...(args.orgId ? { orgId: args.orgId } : {}),
      });
      return { isBlocked: !!existing.isBlocked };
    } else {
      if (!args.orgId) {
         console.error(`Attempted to register NEW computer ${args.id} without orgId!`);
         throw new Error("orgId is required for new registrations");
      }
      await ctx.db.insert("computers", {
        id: args.id,
        name: args.name,
        os: args.os,
        status: "online",
        lastSeen: Date.now(),
        isBlocked: false,
        orgId: args.orgId,
      });
      return { isBlocked: false };
    }
  },
});

export const internalList = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("computers").collect();
  },
});

export const toggleBlock = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing && existing.orgId === orgId) {
      await ctx.db.patch(existing._id, {
        isBlocked: !existing.isBlocked,
      });
    }
  },
});

export const setOffline = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing && existing.orgId === orgId) {
      await ctx.db.patch(existing._id, {
        status: "offline",
        lastSeen: Date.now(),
      });
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    // Check both standard orgId and Clerk's snake_case org_id custom claim
    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    return await ctx.db
      .query("computers")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});
export const rename = mutation({
  args: {
    id: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing && existing.orgId === orgId) {
      await ctx.db.patch(existing._id, {
        name: args.newName,
      });
    }
  },
});

export const heartbeat = mutation({
  args: { id: v.string(), orgId: v.string() },
  handler: async (ctx, args) => {
    const computer = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (computer && computer.orgId === args.orgId) {
      await ctx.db.patch(computer._id, {
        lastSeen: Date.now(),
        status: "online",
      });
    }
  },
});

export const ensureOrg = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_orgId", (q) => q.eq("id", orgId))
      .unique();

    if (!existing) {
      await ctx.db.insert("organizations", { id: orgId });
      console.log(`[CONVEX] Registered new organization: ${orgId}`);
    }
  },
});

export const validateOrg = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_orgId", (q) => q.eq("id", args.id))
      .unique();

    return { isValid: !!existing };
  },
});

export const assignToRoom = mutation({
  args: { 
    computerId: v.id("computers"),
    roomId: v.optional(v.id("rooms")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const computer = await ctx.db.get(args.computerId);
    if (!computer || computer.orgId !== orgId) {
      throw new Error("Computer not found or unauthorized");
    }

    if (args.roomId) {
      const room = await ctx.db.get(args.roomId);
      if (!room || room.orgId !== orgId) {
        throw new Error("Room not found or unauthorized");
      }
    }

    await ctx.db.patch(args.computerId, { roomId: args.roomId });
    console.log(`[CONVEX] Assigned computer ${computer.id} to room ${args.roomId}`);
  },
});
