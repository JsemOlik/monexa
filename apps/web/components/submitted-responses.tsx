"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconChevronRight,
  IconCalendar,
  IconClipboardList,
  IconCheck,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SubmittedResponses() {
  const launches = useQuery(api.surveyResponses.listGrouped);

  if (launches === undefined) {
    return (
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (launches.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 rounded-2xl border-dashed">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-tauri-drag-region
        >
          <div className="size-12 rounded-full bg-sidebar flex items-center justify-center mb-4">
            <IconClipboardList className="size-6 text-zinc-500" />
          </div>
          <CardTitle className="text-zinc-400">No responses yet</CardTitle>
          <CardDescription>
            Submitted survey answers will appear here once users complete them.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {launches.map((launch: any) => (
        <Card className="bg-sidebar border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/50 hover:bg-sidebar-accent/80 transition-all">
          <CardHeader className="px-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-500 border-none text-[0.6rem] font-black uppercase tracking-widest px-2 py-0"
                  >
                    Campaign
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  {launch.surveyTitle}
                </CardTitle>
                <div className="flex items-center gap-6 text-xs text-zinc-500 font-bold uppercase tracking-widest pt-1">
                  <div className="flex items-center gap-1.5">
                    <IconCalendar className="size-3.5" />
                    <span>
                      Launched{" "}
                      {new Date(launch.launchedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconCheck className="size-3.5 text-emerald-500" />
                    <span>{launch.responses.length} Responses</span>
                  </div>
                </div>
              </div>
              <Link
                key={launch.launchId}
                href={`/dashboard/surveys/results/${launch.launchId}`}
                className="block group"
              >
                <div className="flex items-center gap-4">
                  <div className="px-6 py-3 rounded-2xl bg-white/5 text-zinc-400 font-bold uppercase tracking-tighter group-hover:bg-emerald-500 group-hover:text-white transition-all flex items-center gap-2">
                    <span>Zobrazit výsledky</span>
                    <IconChevronRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
