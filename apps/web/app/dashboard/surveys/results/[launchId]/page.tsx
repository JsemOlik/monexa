"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconChevronLeft,
  IconDeviceDesktop,
  IconCalendar,
  IconClipboardList,
  IconClock,
  IconStarFilled,
  IconStar,
  IconCheck,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export default function SurveyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const launchId = params.launchId as Id<"surveyLaunches">;

  const data = useQuery(api.surveyResponses.getResults, { launchId });
  const [expandedComputerId, setExpandedComputerId] = useState<string | null>(
    null,
  );

  const findQuestion = (questionId: string) => {
    return (
      data?.survey?.steps.find((s: any) => s.id === questionId)?.question ||
      questionId
    );
  };

  const isStarRating = (questionId: string) => {
    return (
      data?.survey?.steps.find((s: any) => s.id === questionId)?.type ===
      "star_rating"
    );
  };

  const renderStars = (rating: string) => {
    const num = parseInt(rating) || 0;
    return (
      <div className="flex gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) =>
          s <= num ? (
            <IconStarFilled key={s} className="size-3.5" />
          ) : (
            <IconStar key={s} className="size-3.5 text-zinc-700" />
          ),
        )}
      </div>
    );
  };

  if (data === undefined) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="p-8 space-y-8">
            <Skeleton className="h-12 w-64 bg-white/5 rounded-2xl" />
            <div className="grid gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full bg-white/5 rounded-2xl"
                />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!data || !data.launch) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="p-8 text-center space-y-4">
            <h1 className="text-2xl font-bold">Campaign not found</h1>
            <button
              onClick={() => router.back()}
              className="text-emerald-500 hover:underline"
            >
              Go back
            </button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6 pt-2 max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
            >
              <IconChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Back to Surveys
              </span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  Results Campaign
                </Badge>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-tight">
                  {data.survey?.title || "Unknown Survey"}
                </h1>
                <div className="flex items-center gap-6 text-[10px] text-zinc-500 font-bold uppercase tracking-widest pt-1">
                  <div className="flex items-center gap-2">
                    <IconCalendar className="size-3.5" />
                    <span>
                      Launched{" "}
                      {new Date(data.launch.launchedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconClipboardList className="size-3.5" />
                    <span>{data.responses.length} Total Responses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid/List */}
          <div className="grid gap-2">
            {data.responses.length === 0 ? (
              <Card className="bg-white/5 border-white/10 rounded-2xl border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <IconClock className="size-12 text-zinc-700 mb-4" />
                  <CardTitle className="text-zinc-500">
                    Waiting for responses...
                  </CardTitle>
                </CardContent>
              </Card>
            ) : (
              data.responses.map((resp: any) => {
                const isExpanded = expandedComputerId === resp._id;

                return (
                  <Card
                    key={resp._id}
                    className={cn(
                      "bg-zinc-900/40 border-white/5 rounded-2xl overflow-hidden transition-all group/card",
                      isExpanded
                        ? "border-emerald-500/30 bg-white/[0.02] shadow-2xl"
                        : "hover:border-white/10",
                    )}
                  >
                    <button
                      onClick={() =>
                        setExpandedComputerId(isExpanded ? null : resp._id)
                      }
                      className="w-full text-left p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            "size-10 rounded-xl flex items-center justify-center transition-colors",
                            isExpanded
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-800 text-zinc-500 group-hover/card:bg-zinc-700",
                          )}
                        >
                          <IconDeviceDesktop className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">
                            {resp.computerHostname}
                          </h3>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            {new Date(resp.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 bg-emerald-500/5 px-2 py-1 rounded-lg">
                          <IconCheck className="size-3 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">
                            Done
                          </span>
                        </div>
                        <div
                          className={cn(
                            "size-8 rounded-lg bg-white/5 flex items-center justify-center transition-transform",
                            isExpanded && "rotate-90 text-emerald-500",
                          )}
                        >
                          <IconChevronLeft
                            className={cn(
                              "size-4 transition-colors",
                              isExpanded
                                ? "text-emerald-500"
                                : "text-zinc-600 -rotate-90",
                            )}
                          />
                        </div>
                      </div>
                    </button>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100 border-t border-white/5"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="p-4 bg-black/20 grid gap-3 sm:grid-cols-2">
                          {resp.answers.map((answer: any, idx: number) => {
                            const qText = findQuestion(answer.questionId);
                            const isStars = isStarRating(answer.questionId);

                            return (
                              <div
                                key={idx}
                                className="bg-white/[0.03] rounded-xl p-3 border border-white/5 hover:border-emerald-500/20 transition-colors"
                              >
                                <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 font-black mb-1.5 flex items-center gap-2">
                                  <span className="size-1 bg-emerald-500 rounded-full" />
                                  {qText}
                                </p>
                                {isStars ? (
                                  renderStars(answer.value)
                                ) : (
                                  <p className="text-sm text-zinc-200 font-medium italic">
                                    "{answer.value}"
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
