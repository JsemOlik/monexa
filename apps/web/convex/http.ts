import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      const payload = JSON.parse(payloadString);
      const eventType = payload.type;

      console.log(`[CLERK WEBHOOK] Received event: ${eventType}`);

      if (eventType === "organization.deleted") {
        const { id: orgId } = payload.data;
        console.log(`[CLERK WEBHOOK] Organization deleted: ${orgId}. Triggering purge...`);
        
        await ctx.runMutation(api.organizations.remove, { orgId });
        
        return new Response("Purge triggered successfully", { status: 200 });
      }

      if (eventType === "organization.created") {
        const { id: orgId } = payload.data;
        console.log(`[CLERK WEBHOOK] New organization created: ${orgId}. Registering...`);
        
        await ctx.runMutation(api.organizations.register, { orgId });
        
        return new Response("Organization registered successfully", { status: 200 });
      }

      // Add other event handlers here if needed (e.g. organization.created)

      return new Response("Event received but not handled", { status: 200 });
    } catch (err) {
      console.error("[CLERK WEBHOOK] Error processing webhook:", err);
      return new Response("Error processing webhook", { status: 400 });
    }
  }),
});

export default http;
