import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      orgId,
    });

    return roomId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    return await ctx.db
      .query("rooms")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const room = await ctx.db.get(args.id);
    if (!room || room.orgId !== orgId) throw new Error("Room not found or unauthorized");

    // Unassign computers from this room
    const computers = await ctx.db
      .query("computers")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.id))
      .collect();

    for (const computer of computers) {
      await ctx.db.patch(computer._id, { roomId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
