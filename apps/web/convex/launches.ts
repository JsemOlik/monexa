import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    surveyId: v.id("surveys"),
    targets: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const launchId = await ctx.db.insert("surveyLaunches", {
      surveyId: args.surveyId,
      orgId,
      targets: args.targets,
      status: "active",
      launchedAt: Date.now(),
    });

    return launchId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const launches = await ctx.db
      .query("surveyLaunches")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .order("desc")
      .collect();

    // Join with survey data
    return await Promise.all(
      launches.map(async (launch) => {
        const survey = await ctx.db.get(launch.surveyId);
        return { ...launch, surveyTitle: survey?.title || "Unknown Survey" };
      })
    );
  },
});
