import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const register = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    os: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "online",
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("computers", {
        id: args.id,
        name: args.name,
        os: args.os,
        status: "online",
        lastSeen: Date.now(),
        isBlocked: false,
      });
    }
  },
});

export const toggleBlock = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing) {
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
    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing) {
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
    return await ctx.db.query("computers").collect();
  },
});
export const rename = mutation({
  args: {
    id: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("computers")
      .withIndex("by_computerId", (q) => q.eq("id", args.id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.newName,
      });
    }
  },
});
