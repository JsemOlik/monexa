"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  IconRocket,
  IconChevronRight,
  IconChevronLeft,
  IconUsers,
  IconDevices,
  IconCheck,
  IconSearch,
  IconForms,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface LaunchSurveyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaunchSurveyWizard({
  open,
  onOpenChange,
}: LaunchSurveyWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedComputerIds, setSelectedComputerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const surveys = useQuery(api.surveys.list);
  const rooms = useQuery(api.rooms.list);
  const computers = useQuery(api.computers.list);
  const createLaunch = useMutation(api.surveyLaunches.create);

  const handleLaunch = async () => {
    if (!selectedSurveyId) return;

    // Resolve targets: all computers in selected rooms + individual computers
    const targetComputersSet = new Set<string>(selectedComputerIds);

    if (selectedRoomIds.length > 0) {
      computers?.forEach((c) => {
        if (c.roomId && selectedRoomIds.includes(c.roomId)) {
          targetComputersSet.add(c.id);
        }
      });
    }

    const targets = Array.from(targetComputersSet);

    if (targets.length === 0) {
      toast.error("Please select at least one target computer");
      return;
    }

    setLoading(true);
    try {
      const launchId = await createLaunch({
        surveyId: selectedSurveyId as any,
        targets,
      });

      const survey = surveys?.find((s) => s._id === selectedSurveyId);
      const surveyTitle = survey?.title || "Survey";

      console.log(
        `[LaunchWizard] Emitting launchSurvey for launch ${launchId} to ${targets.length} targets.`,
      );
      const { socket } = await import("@/lib/socket");
      socket.emit("launchSurvey", {
        surveyId: selectedSurveyId,
        launchId,
        targets,
      } as any);

      toast.success("Survey launched successfully!");
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to launch survey");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedSurveyId(null);
    setSelectedRoomIds([]);
    setSelectedComputerIds([]);
    setSearchQuery("");
    setTargetSearchQuery("");
  };

  const handleRoomToggle = (roomId: string) => {
    const isSelected = selectedRoomIds.includes(roomId);
    const roomComputers =
      computers?.filter((c) => c.roomId === roomId && c.status === "online") ||
      [];
    const computerIds = roomComputers.map((c) => c.id);

    if (isSelected) {
      setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
      setSelectedComputerIds((prev) =>
        prev.filter((id) => !computerIds.includes(id)),
      );
    } else {
      setSelectedRoomIds((prev) => [...prev, roomId]);
      setSelectedComputerIds((prev) =>
        Array.from(new Set([...prev, ...computerIds])),
      );
    }
  };

  const handleComputerToggle = (computerId: string) => {
    setSelectedComputerIds((prev) =>
      prev.includes(computerId)
        ? prev.filter((id) => id !== computerId)
        : [...prev, computerId],
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) reset();
      }}
    >
      <DialogContent className="max-w-2xl bg-sidebar border-white/5 p-0 overflow-hidden rounded-3xl">
        <div className="flex flex-col h-[600px]">
          <DialogHeader className="p-6 border-b border-white/5 bg-sidebar-accent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <IconRocket className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Launch Survey
                </DialogTitle>
                <DialogDescription>
                  Deploy your survey to devices in real-time.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    Select Survey
                  </h3>
                  <div className="relative w-48">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                    <Input
                      placeholder="Search..."
                      className="h-8 pl-8 bg-white/5 border-white/5 text-xs rounded-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  {surveys
                    ?.filter((s) =>
                      s.title.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((survey) => (
                      <button
                        key={survey._id}
                        onClick={() => setSelectedSurveyId(survey._id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                          selectedSurveyId === survey._id
                            ? "bg-emerald-500/10 border-emerald-500/50"
                            : "bg-white/5 border-white/5 hover:bg-white/10",
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            selectedSurveyId === survey._id
                              ? "bg-emerald-500 text-white"
                              : "bg-sidebar-accent text-zinc-400",
                          )}
                        >
                          <IconForms className="size-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white">
                            {survey.title}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {survey.steps.length} questions
                          </div>
                        </div>
                        {selectedSurveyId === survey._id && (
                          <IconCheck className="size-5 text-emerald-500" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                    Select Targets
                  </h3>
                  <div className="relative w-48">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                    <Input
                      placeholder="Search targets..."
                      className="h-8 pl-8 bg-white/5 border-white/5 text-xs rounded-lg"
                      value={targetSearchQuery}
                      onChange={(e) => setTargetSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-tighter">
                    Rooms
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {rooms
                      ?.filter((r) =>
                        r.name
                          .toLowerCase()
                          .includes(targetSearchQuery.toLowerCase()),
                      )
                      .map((room) => (
                        <button
                          key={room._id}
                          onClick={() => handleRoomToggle(room._id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            selectedRoomIds.includes(room._id)
                              ? "bg-emerald-500/10 border-emerald-500/50"
                              : "bg-white/5 border-white/5 hover:bg-white/10",
                          )}
                        >
                          <IconUsers
                            className={cn(
                              "size-4",
                              selectedRoomIds.includes(room._id)
                                ? "text-emerald-500"
                                : "text-zinc-500",
                            )}
                          />
                          <span className="text-sm font-medium">
                            {room.name}
                          </span>
                          {selectedRoomIds.includes(room._id) && (
                            <IconCheck className="ml-auto size-4 text-emerald-500" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-tighter">
                    Individual Computers
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {computers
                      ?.filter(
                        (c) =>
                          c.status === "online" &&
                          (c.name
                            .toLowerCase()
                            .includes(targetSearchQuery.toLowerCase()) ||
                            c.id
                              .toLowerCase()
                              .includes(targetSearchQuery.toLowerCase())),
                      )
                      .map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => handleComputerToggle(comp.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left border-r-[4px]",
                            selectedComputerIds.includes(comp.id)
                              ? "bg-emerald-500/10 border-emerald-500/50"
                              : "bg-white/5 border-white/5 hover:bg-white/10",
                            // Right status border — overrides border-r from above
                            comp.isSurveying
                              ? "border-r-purple-500"
                              : comp.isBlocked
                                ? "border-r-red-500"
                                : comp.status === "online"
                                  ? "border-r-emerald-500"
                                  : "border-r-orange-500",
                          )}
                        >
                          <IconDevices
                            className={cn(
                              "size-4",
                              selectedComputerIds.includes(comp.id)
                                ? "text-emerald-500"
                                : "text-zinc-500",
                            )}
                          />
                          <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">
                              {comp.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate">
                              {comp.id}
                            </div>
                          </div>
                          {selectedComputerIds.includes(comp.id) && (
                            <IconCheck className="size-4 text-emerald-500" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-sidebar-accent border-t border-white/5">
            {step === 1 ? (
              <Button
                disabled={!selectedSurveyId}
                onClick={() => setStep(2)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 px-8 font-bold ml-auto"
              >
                Next: Targets
                <IconChevronRight className="ml-2 size-4" />
              </Button>
            ) : (
              <div className="flex justify-between w-full">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="rounded-xl h-11"
                >
                  <IconChevronLeft className="mr-2 size-4" /> Back
                </Button>
                <Button
                  onClick={handleLaunch}
                  disabled={
                    loading ||
                    (selectedRoomIds.length === 0 &&
                      selectedComputerIds.length === 0)
                  }
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 px-10 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {loading ? "Launching..." : "Launch Now"}
                  <IconRocket className="ml-2 size-4" />
                </Button>
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
