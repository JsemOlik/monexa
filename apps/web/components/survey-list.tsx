"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconPlus,
  IconForms,
  IconCalendar,
  IconClipboardList,
} from "@tabler/icons-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function SurveyList() {
  const surveys = useQuery(api.surveys.list);

  if (surveys === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[160px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Surveys</h2>
          <p className="text-sm text-muted-foreground">
            Manage and create your feedback surveys.
          </p>
        </div>
        <Button
          asChild
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
        >
          <Link href="/dashboard/surveys/new">
            <IconPlus className="mr-2 h-4 w-4" />
            Create Survey
          </Link>
        </Button>
      </div>

      {surveys.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 bg-muted/5 border-dashed rounded-3xl min-h-[400px]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <IconClipboardList className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No surveys yet</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground text-center max-w-sm">
            Create your first survey to start collecting feedback from your
            computers.
          </p>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5"
          >
            <Link href="/dashboard/surveys/new">Start building</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <Card
              key={survey._id}
              className="p-6 bg-zinc-950 border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer group rounded-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <IconForms className="h-5 w-5 text-emerald-500" />
                </div>
                <Badge
                  variant={survey.status === "active" ? "default" : "secondary"}
                  className="text-[10px] font-bold"
                >
                  {survey.status.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-500 transition-colors mb-2">
                {survey.title}
              </h3>
              <div className="flex items-center gap-4 mt-auto">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconClipboardList className="h-3 w-3" />
                  {survey.steps.length}{" "}
                  {survey.steps.length === 1 ? "step" : "steps"}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconCalendar className="h-3 w-3" />
                  {new Date(survey.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
