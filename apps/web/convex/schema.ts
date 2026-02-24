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
    roomId: v.optional(v.string()),
    isSurveying: v.optional(v.boolean()),
  })
    .index("by_computerId", ["id"])
    .index("by_orgId", ["orgId"])
    .index("by_roomId", ["roomId"]),

  organizations: defineTable({
    id: v.string(), // orgId or userId
  }).index("by_orgId", ["id"]),

  rooms: defineTable({
    name: v.string(),
    orgId: v.string(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_name", ["name"]),

  surveys: defineTable({
    title: v.string(),
    orgId: v.string(),
    status: v.union(v.literal("active"), v.literal("draft")),
    createdAt: v.number(),
    steps: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("star_rating"),
          v.literal("open_paragraph"),
          v.literal("multiple_choice")
        ),
        question: v.string(),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
      })
    ),
  })
    .index("by_orgId", ["orgId"])
    .index("by_status", ["status"]),

  surveyLaunches: defineTable({
    surveyId: v.id("surveys"),
    orgId: v.string(),
    targets: v.array(v.string()), // list of computer IDs
    status: v.union(v.literal("active"), v.literal("completed")),
    launchedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_surveyId", ["surveyId"]),
});
