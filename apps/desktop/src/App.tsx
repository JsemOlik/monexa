import { useEffect, useState, useRef } from "react";
import { socket } from "./lib/socket";
import { invoke } from "@tauri-apps/api/core";
import {
  emit as tauriEmit,
  listen as tauriListen,
} from "@tauri-apps/api/event";
import {
  type as getOsType,
  hostname as getHostname,
} from "@tauri-apps/plugin-os";
// Inline Icons to avoid dependency resolution issues in Tauri
function IconStar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z" />
    </svg>
  );
}

function IconStarFilled({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
import "./App.css";

// Utility for class merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Simple Button component for Desktop
function Button({ children, onClick, disabled, className }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Simple Badge component for Desktop
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BlockedContent() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 text-white backdrop-blur-md cursor-none">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
        <div className="rounded-full bg-red-500/20 p-6 ring-1 ring-red-500/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m14.5 9-5 5" />
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
  const [mode, setMode] = useState<"prep" | "active" | "done">("prep");
  const [surveyData, setSurveyData] = useState<{
    id: string;
    launchId: string;
    title: string;
    steps: any[];
  } | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
        steps: [],
      });
      setMode("prep");
    };

    // Listen ONLY for triggers from Tauri events (sent by the primary or secondary window's App component)
    const unlistenLaunch = tauriListen("survey-launch-trigger", (event) => {
      console.log("[SURVEY] Tauri: Received survey-launch-trigger");
      handleLaunch(event.payload as any);
    });

    const unlistenStart = tauriListen("survey-start-trigger", (event) => {
      console.log("[SURVEY] Tauri: Received survey-start-trigger");
      handleStart(event.payload as any);
    });

    return () => {
      unlistenLaunch.then((fn) => fn());
      unlistenStart.then((fn) => fn());
      console.log("[SURVEY] Emitting survey-closed Tauri event...");
      tauriEmit("survey-closed", {}).catch(console.error);
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
      } as any);

      setMode("done");
      setTimeout(() => {
        invoke("toggle_survey_window", { open: false }).catch(console.error);
      }, 2000);
    }
  };

  if (mode === "done") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 text-white p-12 text-center">
        <div className="size-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <IconCheck className="size-10 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-emerald-500 mb-2 font-sans">
          Hotovo!
        </h1>
        <p className="text-zinc-400 text-lg">Děkujeme za tvůj čas.</p>
      </div>
    );
  }

  if (mode === "prep" || !surveyData) {
    return (
      <div
        data-tauri-drag-region
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 text-white p-12 text-center"
      >
        <button
          onClick={() => setMode("active")}
          style={{ cursor: "pointer" }}
          className="absolute top-4 right-4 size-4 bg-white/5 rounded-full opacity-0 hover:opacity-100 transition-opacity z-[10000]"
        >
          .
        </button>
        <div className="max-w-2xl space-y-8 animate-in fade-in zoom-in duration-1000">
          <div className="space-y-2">
            <p className="text-emerald-500/50 font-bold uppercase tracking-[0.2em] text-sm">
              Připravujeme dotazník
            </p>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic text-white font-sans">
              {surveyData?.title || "Načítání..."}
            </h1>
          </div>
          <p className="text-zinc-400 text-2xl font-medium leading-relaxed">
            Posad se a nic nedelej, administrator ti za chvilku spusti dotaznik
            :)
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-2 rounded-full bg-emerald-500/50 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStep = surveyData.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / surveyData.steps.length) * 100;

  return (
    <div
      data-tauri-drag-region
      className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950 text-white p-16"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center gap-12 animate-in slide-in-from-bottom-8 duration-700">
        <div className="space-y-4">
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 text-sm font-bold uppercase tracking-widest rounded-lg">
            Otázka {currentStepIndex + 1} z {surveyData.steps.length}
          </Badge>
          <h2 className="text-5xl font-black tracking-tight leading-tight">
            {currentStep.question}
          </h2>
        </div>

        <div className="flex-1 min-h-[300px]">
          {currentStep.type === "star_rating" && (
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((rating) => {
                const isSelected = Number(answers[currentStep.id]) === rating;
                return (
                  <button
                    key={rating}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentStep.id]: rating.toString(),
                      }))
                    }
                    className={cn(
                      "size-20 rounded-2xl flex items-center justify-center transition-all duration-200 border-2",
                      isSelected
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-110"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-500",
                    )}
                  >
                    {isSelected ? (
                      <IconStarFilled className="size-10" />
                    ) : (
                      <IconStar className="size-10" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {currentStep.type === "open_paragraph" && (
            <textarea
              autoFocus
              className="w-full bg-white/5 border-2 border-white/5 focus:border-emerald-500/50 rounded-3xl p-8 text-2xl outline-none transition-all min-h-[250px] resize-none placeholder:text-zinc-700 font-sans"
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
            <div className="grid grid-cols-2 gap-4">
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
                    "p-6 rounded-2xl border-2 text-left text-xl font-bold transition-all",
                    answers[currentStep.id] === option
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-8 border-t border-white/5">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={
              submitting ||
              (currentStep.required && !answers[currentStep.id]?.trim())
            }
            className="h-20 px-12 rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-black uppercase italic tracking-tighter shadow-[0_0_40px_rgba(16,185,129,0.4)]"
          >
            {currentStepIndex < surveyData.steps.length - 1 ? (
              <>
                Další <IconChevronRight className="ml-3 size-8" />
              </>
            ) : (
              <>
                {submitting ? "Odesílám..." : "Odeslat"}
                <IconCheck className="ml-3 size-8" />
              </>
            )}
          </Button>
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
      disconnectTimeoutRef.current = setTimeout(() => {
        invoke("close_secondary_windows").catch(console.error);
      }, 10000);
    }

    function onSetBlocked(blocked: boolean) {
      setIsBlocked(blocked);
    }

    function onSurveyLaunch(data: any) {
      console.log(
        `[SOCKET] SURVEY_LAUNCH received! Survey ID: ${data.surveyId}`,
      );
      // Pass data to survey window via localStorage
      localStorage.setItem("monexa_active_survey", JSON.stringify(data));
      socket.emit("setSurveying", true);
      invoke("toggle_survey_window", { open: true }).catch(console.error);
      // Also forward to secondary window if it's already open
      tauriEmit("survey-launch-trigger", data).catch(console.error);
    }

    function onSurveyStart(data: any) {
      console.log(
        "[SOCKET] SURVEY_START received! Forwarding to survey window...",
      );
      tauriEmit("survey-start-trigger", data).catch(console.error);
    }

    const unlistenSurveyClosed = tauriListen("survey-closed", () => {
      console.log("[TAURI] survey-closed received → refreshing primary socket");
      socket.emit("setSurveying", false);
      // Re-register to ensure main window is the primary socket for this computer
      registerIdentity();
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("setBlocked", onSetBlocked);
    socket.on("surveyLaunch", onSurveyLaunch);
    socket.on("surveyStart", onSurveyStart);

    if (socket.connected && orgId) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("setBlocked", onSetBlocked);
      socket.off("surveyLaunch", onSurveyLaunch);
      socket.off("surveyStart", onSurveyStart);
      unlistenSurveyClosed.then((fn) => fn());
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, [orgId]);

  useEffect(() => {
    if (!isConnected || !orgId) return;
    const interval = setInterval(() => {
      socket.emit("heartbeat");
    }, 10000);
    return () => clearInterval(interval);
  }, [isConnected, orgId]);

  useEffect(() => {
    if (!isBlockedWindow) {
      invoke("toggle_block_window", { blocked: isBlocked }).catch(
        console.error,
      );
    }
  }, [isBlocked, isBlockedWindow]);

  if (isBlockedWindow) {
    return <BlockedContent />;
  }

  if (isSurveyWindow) {
    return <SurveyContent computerHostname={hostname} />;
  }

  if (!orgId) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center bg-zinc-950 text-white">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Setup Monexa</h1>
          <p className="text-zinc-400">
            Please enter your Organization ID from the dashboard.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Organization ID"
              value={tempOrgId}
              onChange={(e) => {
                setTempOrgId(e.target.value);
                setValidationError(null);
              }}
              className={`w-full px-4 py-2 border rounded-md bg-zinc-900 focus:outline-none focus:ring-2 ${
                validationError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-zinc-800 focus:ring-emerald-500"
              }`}
            />
            {validationError && (
              <p className="text-xs text-red-500 text-left mt-1">
                {validationError}
              </p>
            )}
          </div>
          <button
            disabled={isValidating || !tempOrgId.trim()}
            onClick={() => {
              if (tempOrgId.trim()) {
                setIsValidating(true);
                setValidationError(null);
                socket.emit(
                  "validateOrg",
                  { orgId: tempOrgId.trim() },
                  (res: any) => {
                    setIsValidating(false);
                    if (res.isValid) {
                      localStorage.setItem("monexa_org_id", tempOrgId.trim());
                      setOrgId(tempOrgId.trim());
                    } else {
                      setValidationError("Incorrect Organization ID");
                    }
                  },
                );
              }
            }}
            className="w-full py-2 font-medium text-black transition-colors rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900"
          >
            {isValidating ? "Validating..." : "Connect"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="m-0 flex flex-col items-center justify-center gap-3 text-center">
      <h1 className="m-0 text-2xl font-bold tracking-tight text-white">
        Monexa
      </h1>
      <p className="text-xs text-zinc-500 font-mono">
        Org: {orgId.substring(0, 8)}...
      </p>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            isConnected
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
          )}
        />
        <span className="text-[13px] font-medium text-zinc-400">
          {isConnected ? "Connected to Server" : "Disconnected"}
        </span>
      </div>
      {!isConnected && (
        <button
          className="mt-3 rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-[13px]"
          onClick={() => socket.connect()}
        >
          Reconnect
        </button>
      )}
      <button
        onClick={() => {
          localStorage.removeItem("monexa_org_id");
          setOrgId(null);
        }}
        className="text-[10px] text-zinc-600 hover:text-red-500 mt-4 underline"
      >
        Change Organization
      </button>
    </main>
  );
}

export default App;
