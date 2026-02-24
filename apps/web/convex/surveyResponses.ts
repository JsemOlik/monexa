import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submit = mutation({
  args: {
    launchId: v.id("surveyLaunches"),
    surveyId: v.id("surveys"),
    computerHostname: v.string(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const launch = await ctx.db.get(args.launchId);
    if (!launch) throw new Error("Launch not found");

    await ctx.db.insert("surveyResponses", {
      launchId: args.launchId,
      surveyId: args.surveyId,
      orgId: launch.orgId,
      computerHostname: args.computerHostname,
      submittedAt: Date.now(),
      answers: args.answers,
    });

    // Check if all targets have responded — auto-complete the launch
    const responses = await ctx.db
      .query("surveyResponses")
      .withIndex("by_launchId", (q) => q.eq("launchId", args.launchId))
      .collect();

    if (responses.length >= launch.targets.length) {
      await ctx.db.patch(args.launchId, { status: "completed" });
    }
  },
});

export const listForLaunch = query({
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

export const listGrouped = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = (identity as any).org_id || identity.orgId || identity.subject;

    const responses = await ctx.db
      .query("surveyResponses")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .order("desc")
      .collect();

    // Grouping logic
    const groupsMap = new Map<string, any>();

    for (const resp of responses) {
      if (!groupsMap.has(resp.launchId)) {
        const survey = await ctx.db.get(resp.surveyId);
        const launch = await ctx.db.get(resp.launchId);
        
        groupsMap.set(resp.launchId, {
          launchId: resp.launchId,
          surveyId: resp.surveyId,
          surveyTitle: survey?.title || "Unknown Survey",
          launchedAt: launch?.launchedAt || resp.submittedAt,
          responses: [],
        });
      }
      
      groupsMap.get(resp.launchId).responses.push({
        computerHostname: resp.computerHostname,
        submittedAt: resp.submittedAt,
        answers: resp.answers,
      });
    }

    return Array.from(groupsMap.values()).sort((a, b) => b.launchedAt - a.launchedAt);
  },
});

export const getResults = query({
  args: { launchId: v.id("surveyLaunches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const launch = await ctx.db.get(args.launchId);
    if (!launch) return null;

    const survey = await ctx.db.get(launch.surveyId);
    const responses = await ctx.db
      .query("surveyResponses")
      .withIndex("by_launchId", (q) => q.eq("launchId", args.launchId))
      .collect();

    return {
      launch,
      survey,
      responses,
    };
  },
});
