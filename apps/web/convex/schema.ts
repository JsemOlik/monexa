import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  computers: defineTable({
    id: v.string(), // computer id from desktop
    name: v.string(),
    os: v.string(),
    status: v.union(v.literal("online"), v.literal("offline")),
    lastSeen: v.number(), // epoch timestamp
    isBlocked: v.optional(v.boolean()),
  }).index("by_computerId", ["id"]),
});
