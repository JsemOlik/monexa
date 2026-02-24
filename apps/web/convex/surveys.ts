import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const surveyId = await ctx.db.insert("surveys", {
      title: args.title,
      orgId,
      status: "draft",
      createdAt: Date.now(),
      steps: args.steps,
    });

    return surveyId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    return await ctx.db
      .query("surveys")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const survey = await ctx.db.get(args.id);
    if (!survey || survey.orgId !== orgId) {
      throw new Error("Survey not found or unauthorized");
    }

    return survey;
  },
});

export const remove = mutation({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const survey = await ctx.db.get(args.id);
    if (!survey || survey.orgId !== orgId) {
      throw new Error("Survey not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("surveys"),
    title: v.string(),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const survey = await ctx.db.get(args.id);
    if (!survey || survey.orgId !== orgId) {
      throw new Error("Survey not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      steps: args.steps,
    });
  },
});
