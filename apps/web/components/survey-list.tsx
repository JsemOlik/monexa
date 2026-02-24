"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconPlus,
  IconForms,
  IconCalendar,
  IconClipboardList,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { LaunchSurveyWizard } from "./launch-survey-wizard";
import { IconRocket } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function SurveyList() {
  const surveys = useQuery(api.surveys.list);
  const removeSurvey = useMutation(api.surveys.remove);
  const router = useRouter();

  const [launchWizardOpen, setLaunchWizardOpen] = useState(false);

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
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button
            onClick={() => setLaunchWizardOpen(true)}
            variant="outline"
            className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 rounded-xl h-10"
          >
            <IconRocket className="mr-2 h-4 w-4" />
            Launch Survey
          </Button>
          <Button
            asChild
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10"
          >
            <Link href="/dashboard/surveys/new">
              <IconPlus className="mr-2 h-4 w-4" />
              Create Survey
            </Link>
          </Button>
        </div>
      </div>

      <LaunchSurveyWizard
        open={launchWizardOpen}
        onOpenChange={setLaunchWizardOpen}
      />

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
              className="p-6 bg-sidebar border-white/5 hover:border-emerald-500/30 transition-all rounded-2xl group relative"
            >
              {/* Action buttons — appear on hover */}
              <div
                className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10"
                  onClick={() =>
                    router.push(`/dashboard/surveys/${survey._id}/edit`)
                  }
                  title="Edit survey"
                >
                  <IconPencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete survey"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10 bg-sidebar text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete survey?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        "{survey.title}" will be permanently deleted. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={async () => {
                          try {
                            await removeSurvey({ id: survey._id });
                            toast.success("Survey deleted");
                          } catch {
                            toast.error("Failed to delete survey");
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <IconForms className="h-5 w-5 text-emerald-500" />
                </div>
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
