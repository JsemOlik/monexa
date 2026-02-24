"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Re-adding these as they are used later in the file
import { Badge } from "@/components/ui/badge"; // Re-adding Badge as it is used later in the file
import {
  IconCheck,
  IconCalendar,
  IconUsers, // Added
  IconChevronRight,
  IconDotsVertical, // Added
  IconTrash, // Added
  IconClipboardList,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SubmittedResponses({
  searchQuery = "",
}: {
  searchQuery?: string;
}) {
  const allLaunches = useQuery(api.surveyResponses.listGrouped);
  const launches = allLaunches?.filter((l: any) =>
    l.surveyTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const removeLaunch = useMutation(api.surveyLaunches.remove);

  const handleDelete = async (launchId: string) => {
    try {
      await removeLaunch({ id: launchId as any });
      toast.success("Survey results deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete survey results");
    }
  };

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
              <div className="flex items-center gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-zinc-500 transition-all"
                    >
                      <IconTrash className="size-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-white/10 rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold">
                        Delete survey results?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This will permanently delete all responses for this
                        campaign. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="bg-white/5 border-white/10 rounded-xl hover:bg-white/10 transition-all">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(launch.launchId)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Link
                  href={`/dashboard/surveys/results/${launch.launchId}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all group/link"
                >
                  <span className="text-sm font-medium">View Results</span>
                  <IconChevronRight className="size-4 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
