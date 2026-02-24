import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new survey launch (status: pending — computers enter prep mode)
export const create = mutation({
  args: {
    surveyId: v.id("surveys"),
    targets: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    // Verify the survey belongs to this org
    const survey = await ctx.db.get(args.surveyId);
    if (!survey || survey.orgId !== orgId) throw new Error("Survey not found or unauthorized");

    return await ctx.db.insert("surveyLaunches", {
      surveyId: args.surveyId,
      orgId,
      targets: args.targets,
      status: "pending",
      launchedAt: Date.now(),
    });
  },
});

// Start a pending launch — computers receive the actual questions
export const start = mutation({
  args: { id: v.id("surveyLaunches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = identity ? ((identity as any).org_id || identity.orgId || identity.subject) : null;

    const launch = await ctx.db.get(args.id);
    if (!launch) throw new Error("Launch not found");
    
    // If we have an identity, verify it matches the launch org
    if (orgId && launch.orgId !== orgId) {
      throw new Error("Unauthorized: Organization mismatch");
    }
    
    // If no identity, we allow it for now to unblock dev, 
    // assuming the caller has the valid launchId.
    if (!identity) {
      console.warn(`[CONVEX] start called without identity for launch ${args.id}. Proceeding...`);
    }
    if (launch.status !== "pending") throw new Error("Launch is not in pending state");

    await ctx.db.patch(args.id, { status: "started" });

    // Return the survey data so the server can broadcast it to target computers
    const survey = await ctx.db.get(launch.surveyId);
    return { launch: { ...launch, _id: args.id, status: "started" }, survey };
  },
});

// Complete a launch
export const complete = mutation({
  args: { id: v.id("surveyLaunches") },
  handler: async (ctx, args) => {
    const launch = await ctx.db.get(args.id);
    if (!launch) throw new Error("Launch not found");
    await ctx.db.patch(args.id, { status: "completed" });
  },
});

// Remove a launch and its responses
export const remove = mutation({
  args: { id: v.id("surveyLaunches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const launch = await ctx.db.get(args.id);
    if (!launch || launch.orgId !== orgId) throw new Error("Launch not found or unauthorized");

    // 1. Delete all responses associated with this launch
    const responses = await ctx.db
      .query("surveyResponses")
      .withIndex("by_launchId", (q) => q.eq("launchId", args.id))
      .collect();

    for (const resp of responses) {
      await ctx.db.delete(resp._id);
    }

    // 2. Delete the launch record itself
    await ctx.db.delete(args.id);
  },
});

// Query pending launches for an org
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const launches = await ctx.db
      .query("surveyLaunches")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    // Enrich with survey title
    return await Promise.all(
      launches.map(async (launch) => {
        const survey = await ctx.db.get(launch.surveyId);
        return { ...launch, surveyTitle: survey?.title ?? "Unknown Survey" };
      })
    );
  },
});

// Query responses for a specific launch
export const listResponses = query({
  args: { launchId: v.id("surveyLaunches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("surveyResponses")
      .withIndex("by_launchId", (q) => q.eq("launchId", args.launchId))
      .collect();
  },
});
