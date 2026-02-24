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
    orgId: v.string(),
  })
    .index("by_computerId", ["id"])
    .index("by_orgId", ["orgId"]),

  organizations: defineTable({
    id: v.string(), // orgId or userId
  }).index("by_orgId", ["id"]),
});
