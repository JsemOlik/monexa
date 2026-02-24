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

export default function SurveysPage() {
  const pendingCount = useQuery(api.surveyLaunches.listPending)?.length ?? 0;
  const responseCount = useQuery(api.surveyResponses.listGrouped)?.length ?? 0;

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
              </TabsList>
            </div>

            <TabsContent
              value="all"
              className="mt-0 border-none p-0 outline-none"
            >
              <SurveyList />
            </TabsContent>

            <TabsContent
              value="pending"
              className="mt-0 border-none p-0 outline-none"
            >
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Pending Launches
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Trigger the actual questions on computers currently in prep
                    mode.
                  </p>
                </div>
                <PendingLaunches />
              </div>
            </TabsContent>

            <TabsContent
              value="submitted"
              className="mt-0 border-none p-0 outline-none"
            >
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Submitted Surveys
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View answers from completed surveys across all computers.
                  </p>
                </div>
                <SubmittedResponses />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
