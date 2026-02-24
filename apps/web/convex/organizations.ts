import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const remove = mutation({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    // Note: This would typically be called by a webhook from Clerk or an admin action.
    // Cascading delete for all data tied to this orgId.

    // 1. Delete all computers
    const computers = await ctx.db
      .query("computers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
    
    for (const computer of computers) {
      await ctx.db.delete(computer._id);
    }

    // 2. Delete all rooms
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    for (const room of rooms) {
      await ctx.db.delete(room._id);
    }

    // 3. Delete organization record
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_orgId", (q) => q.eq("id", args.orgId))
      .unique();
    
    if (org) {
      await ctx.db.delete(org._id);
    }

    console.log(`[CONVEX] Purged all data for organization: ${args.orgId}`);
  },
});

export const register = mutation({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_orgId", (q) => q.eq("id", args.orgId))
      .unique();

    if (!existing) {
      await ctx.db.insert("organizations", { id: args.orgId });
      console.log(`[CONVEX] Registered new organization: ${args.orgId}`);
    }
  },
});
