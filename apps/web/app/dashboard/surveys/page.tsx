"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SurveyList } from "@/components/survey-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingLaunches } from "@/components/pending-launches";
import { SubmittedResponses } from "@/components/submitted-responses";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { Unauthorized } from "@/components/unauthorized";

export default function SurveysPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const pendingCount = useQuery(api.surveyLaunches.listPending)?.length ?? 0;
  const responseCount = useQuery(api.surveyResponses.listGrouped)?.length ?? 0;
  const { has } = useAuth();
  const canViewSubmitted = has?.({ permission: "org:surveys:view_submitted" });
  const canViewPending = has?.({ permission: "org:surveys:view_pending" });
  const canCancelPending = has?.({ permission: "org:surveys:cancel_pending" });
  const canLaunchSurvey = has?.({ permission: "org:surveys:launch_survey" });

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
        <div className="flex flex-1 flex-col p-6 pt-2">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <TabsList className="bg-white/5 border-white/10 rounded-xl p-1">
                <TabsTrigger
                  value="all"
                  className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all px-6"
                >
                  All Surveys
                </TabsTrigger>
                {canViewPending && (
                  <TabsTrigger
                    value="pending"
                    className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all px-6 gap-2"
                  >
                    Pending
                    {pendingCount > 0 && (
                      <Badge className="bg-amber-500 hover:bg-amber-500 text-black border-none size-5 p-0 flex items-center justify-center font-bold text-[10px] rounded-full">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                {canViewSubmitted && (
                  <TabsTrigger
                    value="submitted"
                    className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all px-6 gap-2"
                  >
                    Submitted
                    {responseCount > 0 && (
                      <Badge className="bg-blue-500 hover:bg-blue-500 text-white border-none size-5 p-0 flex items-center justify-center font-bold text-[10px] rounded-full">
                        {responseCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input
                  placeholder="Search surveys..."
                  className="pl-9 bg-white/5 border-white/10 rounded-xl h-10 focus-visible:ring-emerald-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent
              value="all"
              className="mt-0 border-none p-0 outline-none"
            >
              <SurveyList searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent
              value="pending"
              className="mt-0 border-none p-0 outline-none"
            >
              {canViewPending ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Pending Launches
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Trigger the actual questions on computers currently in
                      prep mode.
                    </p>
                  </div>
                  <PendingLaunches
                    searchQuery={searchQuery}
                    canCancel={!!canCancelPending}
                    canLaunch={!!canLaunchSurvey}
                  />
                </div>
              ) : (
                <Unauthorized message="You don't have permission to view pending survey launches." />
              )}
            </TabsContent>

            <TabsContent
              value="submitted"
              className="mt-0 border-none p-0 outline-none"
            >
              {canViewSubmitted ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Submitted Surveys
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      View answers from completed surveys across all computers.
                    </p>
                  </div>
                  <SubmittedResponses searchQuery={searchQuery} />
                </div>
              ) : (
                <Unauthorized message="You don't have permission to view submitted survey results." />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
