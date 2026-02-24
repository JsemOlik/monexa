import { useState, useEffect, useRef } from "react";
import "./App.css";
import { socket } from "./lib/socket";
import { tauriListen, tauriEmit, getOsType, getHostname } from "./tauri-utils";
import { cn } from "./lib/utils";
import {
  IconCheck,
  IconStar,
  IconStarFilled,
  IconChevronRight,
} from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";

function BlockedContent() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-12 text-center bg-zinc-950 text-white">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <svg
            className="size-24 text-red-500 animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <path d="m9.5 9 5 5" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Your computer is blocked
          </h1>
          <p className="text-zinc-400 text-lg">
            Please contact your administrator for further details.
          </p>
        </div>
      </div>
    </div>
  );
}

function SurveyContent({ computerHostname }: { computerHostname: string }) {
  const [mode, setMode] = useState<"prep" | "active" | "done" | null>(null);
  const [surveyData, setSurveyData] = useState<{
    id: string;
    launchId: string;
    title: string;
    style: "futuristic" | "default";
    steps: any[];
  } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  useEffect(() => {
    // Try to load initial prep state from localStorage (pass from main window)
    const saved = localStorage.getItem("monexa_active_survey");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        console.log(
          "[SURVEY] Loading initial state from storage:",
          data.surveyTitle,
        );
        setSurveyData({
          id: data.surveyId,
          launchId: data.launchId,
          title: data.surveyTitle,
          style: data.style || "futuristic",
          steps: [],
        });
        setMode("prep");
      } catch (e) {
        console.error("[SURVEY] Failed to parse saved survey state", e);
      }
    }

    const handleStart = (data: {
      surveyId: string;
      launchId: string;
      steps: any[];
    }) => {
      console.log(
        `[SURVEY] Start trigger processed. Steps: ${data.steps?.length ?? 0}`,
      );
      setSurveyData((prev) => {
        return {
          id: data.surveyId,
          launchId: data.launchId,
          title: prev?.title || "Survey",
          style: (data as any).style || prev?.style || "futuristic",
          steps: data.steps,
        };
      });
      setMode("active");
      setCurrentStepIndex(0);
      setAnswers({});
    };

    const handleLaunch = (data: {
      surveyId: string;
      launchId: string;
      surveyTitle: string;
    }) => {
      console.log(`[SURVEY] Launch trigger processed: ${data.surveyTitle}`);
      setSurveyData({
        id: data.surveyId,
        launchId: data.launchId,
        title: data.surveyTitle,
        style: (data as any).style || "futuristic",
        steps: [],
      });
      setMode("prep");
    };

    // Listen ONLY for triggers from Tauri events (sent by the primary or secondary window's App component)
    const unlistenLaunch = tauriListen(
      "survey-launch-trigger",
      (event: any) => {
        console.log("[SURVEY] Tauri: Received survey-launch-trigger");
        handleLaunch(event.payload as any);
      },
    );

    const unlistenStart = tauriListen("survey-start-trigger", (event: any) => {
      console.log("[SURVEY] Tauri: Received survey-start-trigger");
      handleStart(event.payload as any);
    });

    const unlistenCancel = tauriListen(
      "survey-cancel-trigger",
      (event: any) => {
        console.log("[SURVEY] Tauri: Received survey-cancel-trigger");
        setMode(null);
        setSurveyData(null);
        invoke("toggle_survey_window", { open: false }).catch(console.error);
        socket.emit("setSurveying", false);
      },
    );

    return () => {
      unlistenLaunch.then((fn: any) => fn());
      unlistenStart.then((fn: any) => fn());
      unlistenCancel.then((fn: any) => fn());
    };
  }, []);

  const handleNext = async () => {
    if (!surveyData) return;

    if (currentStepIndex < surveyData.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([id, val]) => ({
        questionId: id,
        value: val,
      }));

      console.log(
        `[SURVEY] Submitting for ${computerHostname}:`,
        formattedAnswers,
      );
      socket.emit("submitSurveyResponse", {
        launchId: surveyData.launchId,
        surveyId: surveyData.id,
        answers: formattedAnswers,
      });

      setMode("done");
      setTimeout(() => {
        invoke("toggle_survey_window", { open: false }).catch(console.error);
      }, 2000);
    }
  };

  if (mode === "done") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-12 text-center bg-zinc-950 text-white">
        <div
          className={cn(
            "size-20 rounded-full flex items-center justify-center mb-6",
            surveyData?.style !== "default"
              ? "bg-emerald-500/20"
              : "bg-zinc-900",
          )}
        >
          <IconCheck className="size-10 text-emerald-500" />
        </div>
        <h1
          className={cn(
            "text-4xl mb-2",
            surveyData?.style !== "default"
              ? "font-black italic uppercase tracking-tighter text-emerald-500 font-sans"
              : "font-bold text-white",
          )}
        >
          Hotovo!
        </h1>
        <p className="text-lg text-zinc-400">Děkujeme za tvůj čas.</p>
      </div>
    );
  }

  if (mode === "prep" || !surveyData) {
    return (
      <div
        data-tauri-drag-region
        className="fixed inset-0 flex flex-col items-center justify-center p-12 text-center bg-zinc-950 text-white"
      >
        <button
          onClick={() => setMode("active")}
          style={{ cursor: "pointer" }}
          className="absolute top-4 right-4 size-4 bg-black/5 rounded-full opacity-0 hover:opacity-100 transition-opacity z-[10000]"
        >
          .
        </button>
        <div className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <p
              className={cn(
                "font-bold uppercase tracking-[0.2em] text-sm",
                surveyData?.style !== "default"
                  ? "text-emerald-500/50"
                  : "text-zinc-500",
              )}
            >
              Připravujeme dotazník
            </p>
            <h1
              className={cn(
                "text-6xl tracking-tighter",
                surveyData?.style !== "default"
                  ? "font-black uppercase italic text-white font-sans"
                  : "font-bold text-white",
              )}
            >
              {surveyData?.title || "Načítání..."}
            </h1>
          </div>
          <p className="text-2xl font-medium leading-relaxed text-zinc-400">
            Posad se a nic nedelej, administrator ti za chvilku spusti dotaznik
            :)
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "size-2 rounded-full animate-bounce",
                  surveyData?.style !== "default"
                    ? "bg-emerald-500/50"
                    : "bg-zinc-300",
                )}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStep = surveyData.steps[currentStepIndex];
  if (!currentStep) return null;
  const progress = ((currentStepIndex + 1) / surveyData.steps.length) * 100;

  return (
    <div
      data-tauri-drag-region
      className="h-svh w-full flex flex-col p-16 bg-zinc-950 text-white"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col text-center">
        <div className="flex-1 flex flex-col items-center justify-center gap-12">
          <div className="space-y-4">
            <div
              className={cn(
                "inline-flex items-center px-3 py-1 text-sm font-bold uppercase tracking-widest rounded-lg border",
                surveyData?.style !== "default"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800",
              )}
            >
              Otázka {currentStepIndex + 1} z {surveyData.steps.length}
            </div>
            <h2
              className={cn(
                "text-5xl tracking-tight leading-tight",
                surveyData?.style !== "default"
                  ? "font-black"
                  : "font-bold text-white",
              )}
            >
              {currentStep.question}
            </h2>
          </div>

          <div className="w-full min-h-[300px] flex flex-col items-center justify-center">
            {currentStep.type === "star_rating" && (
              <div
                className="flex gap-4 justify-center"
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((rating) => {
                  const currentSelection = Number(answers[currentStep.id]) || 0;
                  const isSelected = currentSelection === rating;
                  const isActive =
                    rating <= (hoveredRating || currentSelection);

                  return (
                    <button
                      key={rating}
                      onMouseEnter={() => setHoveredRating(rating)}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [currentStep.id]: rating.toString(),
                        }))
                      }
                      className={cn(
                        "size-20 rounded-2xl flex items-center justify-center transition-all duration-200 border-2",
                        surveyData?.style !== "default"
                          ? isActive
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                            : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-500"
                          : isActive
                            ? "bg-zinc-800 border-zinc-700 text-white"
                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-500",
                        surveyData?.style !== "default" &&
                          isSelected &&
                          "scale-110 shadow-[0_0_40px_rgba(16,185,129,0.5)]",
                        surveyData?.style === "default" &&
                          isSelected &&
                          "ring-4 ring-emerald-500/20 border-emerald-500",
                      )}
                    >
                      {isActive ? (
                        <IconStarFilled
                          className={cn(
                            "size-10",
                            surveyData?.style !== "default"
                              ? "text-white"
                              : "text-emerald-500",
                          )}
                        />
                      ) : (
                        <IconStar className="size-10 text-zinc-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep.type === "open_paragraph" && (
              <textarea
                autoFocus
                className={cn(
                  "w-full rounded-3xl p-8 text-2xl outline-none transition-all min-h-[250px] resize-none font-sans",
                  surveyData?.style !== "default"
                    ? "bg-white/5 border-2 border-white/5 focus:border-emerald-500/50 text-white placeholder:text-zinc-700"
                    : "bg-zinc-900 border-2 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-700",
                )}
                placeholder="Tvoje odpověď..."
                value={answers[currentStep.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentStep.id]: e.target.value,
                  }))
                }
              />
            )}

            {currentStep.type === "multiple_choice" && (
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                {currentStep.options?.map((option: string) => (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentStep.id]: option,
                      }))
                    }
                    className={cn(
                      "p-6 rounded-2xl border-2 text-xl font-bold transition-all",
                      surveyData?.style !== "default"
                        ? answers[currentStep.id] === option
                          ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400"
                        : answers[currentStep.id] === option
                          ? "bg-zinc-800 border-zinc-700 text-white"
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-white/5">
          <button
            onClick={handleNext}
            disabled={
              submitting ||
              (currentStep.required && !answers[currentStep.id]?.trim())
            }
            className={cn(
              "h-20 px-12 rounded-3xl text-2xl uppercase tracking-tighter transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed",
              surveyData?.style !== "default"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white font-black italic shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                : "bg-white text-zinc-950 font-bold hover:bg-zinc-200",
            )}
          >
            {currentStepIndex < surveyData.steps.length - 1 ? (
              <>
                Další <IconChevronRight className="size-8" />
              </>
            ) : (
              <>
                {submitting ? "Odesílám..." : "Odeslat"}
                <IconCheck className="size-8" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hostname, setHostname] = useState("unknown-host");
  const [orgId, setOrgId] = useState<string | null>(
    localStorage.getItem("monexa_org_id"),
  );
  const [tempOrgId, setTempOrgId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isBlockedWindow = window.location.hash === "#/blocked";
  const isSurveyWindow = window.location.hash === "#/survey";
  const disconnectTimeoutRef = useRef<any>(null);

  const registerIdentity = async () => {
    if (!orgId) return;
    const os = (await getOsType()) ?? "unknown";
    const hName = (await getHostname()) ?? "unknown-host";
    setHostname(hName);
    console.log(
      `[SOCKET] Registering identity: ${hName} (OS: ${os}, Org: ${orgId})`,
    );
    socket.emit("registerComputer", {
      id: hName,
      name: hName,
      os,
      orgId: orgId,
    });
  };

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }
      registerIdentity();
    }

    function onDisconnect() {
      setIsConnected(false);
      // Wait 5 seconds before showing offline state if not reconnected
      if (!disconnectTimeoutRef.current) {
        disconnectTimeoutRef.current = setTimeout(() => {
          setIsBlocked(false);
        }, 5000);
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("setBlocked", (blocked: boolean) => {
      setIsBlocked(blocked);
    });

    socket.on("surveyLaunch", (data: any) => {
      console.log("[SOCKET] surveyLaunch received:", data);
      tauriEmit("survey-launch-trigger", data);
      invoke("toggle_survey_window", { open: true }).catch(console.error);
    });

    socket.on("surveyStart", (data: any) => {
      console.log("[SOCKET] surveyStart received:", data);
      tauriEmit("survey-start-trigger", data);
      invoke("toggle_survey_window", { open: true }).catch(console.error);
    });

    socket.on("surveyCancel", (data: any) => {
      console.log("[SOCKET] surveyCancel received:", data);
      tauriEmit("survey-cancel-trigger", data);
    });

    if (socket.connected) {
      onConnect();
    }

    // Listen for window management events from other windows
    const unlistenVisibility = tauriListen(
      "toggle-main-visibility",
      (event: any) => {
        const visible = event.payload as boolean;
        console.log("[TAURI] Visibility toggle received:", visible);
      },
    );

    const unlistenSurvey = tauriListen(
      "toggle-survey-visibility",
      (event: any) => {
        const open = (event.payload as any).open;
        console.log("[TAURI] Survey visibility toggle received:", open);
        if (open) {
          window.location.hash = "#/survey";
        } else {
          window.location.hash = "";
        }
      },
    );

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("setBlocked");
      socket.off("surveyLaunch");
      socket.off("surveyStart");
      unlistenVisibility.then((fn: any) => fn());
      unlistenSurvey.then((fn: any) => fn());
    };
  }, [orgId]);

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempOrgId.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      // Handshake with the server to validate the Org ID
      socket.emit("validateOrg", { orgId: tempOrgId }, (response: any) => {
        setIsValidating(false);
        if (response.isValid) {
          localStorage.setItem("monexa_org_id", tempOrgId);
          setOrgId(tempOrgId);
          registerIdentity();
        } else {
          setValidationError("Invalid Organization ID. Please try again.");
        }
      });
    } catch (err) {
      setIsValidating(false);
      setValidationError("Connection error. Please try again.");
    }
  };

  if (!orgId) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <div className="w-full max-w-sm space-y-8 relative">
          {/* Background Decorative Element */}
          <div className="absolute -top-24 -left-24 size-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-24 -right-24 size-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />

          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-6 group transition-all hover:bg-emerald-500/10 hover:border-emerald-500/20">
              <svg
                className="w-8 h-8 text-emerald-500 transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              Monexa{" "}
              <span className="text-emerald-500 font-sans not-italic">
                Control
              </span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">
              Enter organization ID to register this device
            </p>
          </div>

          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Organization ID"
                  value={tempOrgId}
                  onChange={(e) => setTempOrgId(e.target.value)}
                  className={cn(
                    "w-full h-14 bg-white/5 border-2 border-white/5 rounded-xl px-4 font-bold text-center transition-all",
                    "focus:bg-white/[0.08] focus:border-emerald-500/30 outline-none",
                    "placeholder:text-zinc-700",
                    validationError && "border-red-500/50 bg-red-500/5",
                  )}
                />
              </div>
              {validationError && (
                <p className="text-xs text-red-500 text-center font-bold animate-in fade-in slide-in-from-top-1">
                  {validationError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isValidating || !tempOrgId.trim()}
              className="w-full h-14 bg-white text-zinc-950 hover:bg-emerald-500 hover:text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-emerald-500/20 disabled:opacity-50 disabled:bg-zinc-800 flex items-center justify-center"
            >
              {isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Linking...</span>
                </div>
              ) : (
                "Register Device"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Choose content based on window hash and state
  if (isSurveyWindow) {
    return <SurveyContent computerHostname={hostname} />;
  }

  if (isBlockedWindow || isBlocked) {
    return <BlockedContent />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden pointer-events-none">
      <div className="max-w-md w-full space-y-6 text-center animate-in fade-in zoom-in-95 pointer-events-auto">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            <div className="relative size-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group">
              <svg
                className="size-10 text-emerald-500 transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Device{" "}
            <span className="text-emerald-500 font-sans not-italic">
              Registered
            </span>
          </h1>
          <p className="text-zinc-500 font-medium">
            Hostname of this PC:{" "}
            <span className="text-zinc-300">{hostname}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-6">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
              Status
            </p>
            <div className="flex items-center justify-center gap-2">
              <div
                className={cn(
                  "size-1.5 rounded-full animate-pulse",
                  isConnected ? "bg-emerald-500" : "bg-zinc-600",
                )}
              />
              <span className="text-sm font-bold uppercase tracking-tight">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1 group hover:border-emerald-500/20 transition-all cursor-help">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
              Org ID
            </p>
            <p className="text-sm font-bold tracking-tight truncate px-2">
              {orgId}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] pt-8 opacity-50">
          Monexa Software
        </p>

        {/* Change Org Reset Button (Hidden usually) */}
        <button
          onClick={() => {
            if (confirm("Reset organization token?")) {
              localStorage.removeItem("monexa_org_id");
              window.location.reload();
            }
          }}
          className="mt-8 text-[10px] text-zinc-800 hover:text-red-900 font-black uppercase tracking-widest transition-colors opacity-0 hover:opacity-100"
        >
          Reset Token
        </button>
      </div>
    </div>
  );
}

export default App;
