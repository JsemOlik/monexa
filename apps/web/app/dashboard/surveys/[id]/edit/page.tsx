"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SurveyWizard } from "@/components/survey-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";

export default function EditSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const survey = useQuery(api.surveys.get, { id: id as Id<"surveys"> });

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
        <div className="flex flex-1 flex-col p-4 pt-0">
          {survey === undefined ? (
            <div className="max-w-4xl mx-auto w-full py-8 space-y-6">
              <Skeleton className="h-12 w-64 rounded-2xl" />
              <Skeleton className="h-[400px] w-full rounded-3xl" />
            </div>
          ) : (
            <SurveyWizard
              surveyId={survey._id}
              initialTitle={survey.title}
              initialQuestions={survey.steps}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
