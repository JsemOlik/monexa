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
          <div className="size-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
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
        <Link
          key={launch.launchId}
          href={`/dashboard/surveys/results/${launch.launchId}`}
          className="block group"
        >
          <Card className="bg-zinc-950/50 border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/50 hover:bg-zinc-900 transition-all">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-black uppercase tracking-widest px-2 py-0"
                    >
                      Campaign
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight text-white uppercase italic">
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

                <div className="flex items-center gap-4">
                  <div className="px-6 py-3 rounded-2xl bg-white/5 text-zinc-400 font-black uppercase italic tracking-tighter group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
                    <span>Zobrazit výsledky</span>
                    <IconChevronRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
