"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconRocket,
  IconClock,
  IconUsers,
  IconPlayerPlayFilled,
  IconCheck,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

export function PendingLaunches() {
  const pendingLaunches = useQuery(api.surveyLaunches.listPending);
  const startSurvey = useMutation(api.surveyLaunches.start);
  const [startingIds, setStartingIds] = useState<Set<string>>(new Set());

  const handleStart = async (launchId: string) => {
    setStartingIds((prev) => new Set(prev).add(launchId));
    try {
      console.log(
        `[PendingLaunches] Starting survey launch in DB: ${launchId}`,
      );

      // 1. Mutate in DB (Authenticated as current user)
      const result = (await startSurvey({ id: launchId as any })) as any;

      console.log(
        `[PendingLaunches] DB updated. Notifying server to broadcast questions...`,
      );
      const { socket } = await import("@/lib/socket");

      // 2. Emit socket event - pass the survey data and targets along
      socket.emit("startSurvey", {
        launchId,
        survey: result.survey,
        targets: result.launch.targets,
      });

      toast.success("Survey questions started on all target computers!");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to start survey",
      );
    } finally {
      setStartingIds((prev) => {
        const next = new Set(prev);
        next.delete(launchId);
        return next;
      });
    }
  };

  if (pendingLaunches === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[140px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (pendingLaunches.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 bg-muted/5 border-dashed rounded-3xl min-h-[400px]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <IconClock className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No pending surveys</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground text-center max-w-sm">
          Launch a survey from the Surveys tab to see it here.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pendingLaunches.map((launch) => (
        <Card
          key={launch._id}
          className="p-6 bg-zinc-950 border-white/5 hover:border-emerald-500/30 transition-all rounded-2xl group flex flex-col gap-4"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-bold text-white group-hover:text-emerald-500 transition-colors">
                {launch.surveyTitle}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconClock className="size-3" />
                Launched {new Date(launch.launchedAt).toLocaleTimeString()}
              </div>
            </div>
            {launch.status === "started" ? (
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                Live
              </div>
            ) : (
              <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                Pending
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <IconUsers className="size-3.5 text-emerald-500/60" />
            <span>Targeting {launch.targets.length} computers</span>
          </div>

          <Button
            className={`w-full text-white rounded-xl h-10 mt-2 shadow-lg transition-all ${
              launch.status === "started"
                ? "bg-zinc-800 hover:bg-zinc-700 border border-white/10"
                : "bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
            }`}
            onClick={() =>
              launch.status !== "started" && handleStart(launch._id)
            }
            disabled={
              startingIds.has(launch._id) || launch.status === "started"
            }
          >
            {startingIds.has(launch._id) ? (
              <>Starting...</>
            ) : launch.status === "started" ? (
              <>
                <IconCheck className="mr-2 h-4 w-4" />
                Questions Live
              </>
            ) : (
              <>
                <IconPlayerPlayFilled className="mr-2 h-4 w-4" />
                Start Questions
              </>
            )}
          </Button>
        </Card>
      ))}
    </div>
  );
}
