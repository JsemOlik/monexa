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
import "./App.css";

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

function SurveyContent() {
  useEffect(() => {
    // When the survey window unmounts, notify the main window via Tauri IPC
    // so it can emit setSurveying(false) on its registered socket
    return () => {
      console.log("[SURVEY] Emitting survey-closed Tauri event...");
      tauriEmit("survey-closed", {}).catch(console.error);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 text-white cursor-none">
      <div className="animate-in fade-in zoom-in duration-1000">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          Survey
        </h1>
      </div>
    </div>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isBlocked, setIsBlocked] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(
    localStorage.getItem("monexa_org_id"),
  );
  const [tempOrgId, setTempOrgId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isBlockedWindow = window.location.hash === "#/blocked";
  const isSurveyWindow = window.location.hash === "#/survey";
  const disconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }

      // Register with orgId if we have it
      if (orgId) {
        (async () => {
          const os = (await getOsType()) ?? "unknown";
          const hostname = (await getHostname()) ?? "unknown-host";
          console.log(
            `[SOCKET] Registering dynamic identity: ${hostname} (OS: ${os}, Org: ${orgId})`,
          );

          socket.emit("registerComputer", {
            id: hostname,
            name: hostname,
            os,
            orgId: orgId,
          });
        })();
      }
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

    function onSurveyLaunch(data: { surveyId: string }) {
      console.log(
        `[SOCKET] SURVEY_LAUNCH received! Survey ID: ${data.surveyId}`,
      );
      // Emit setSurveying on the main window's registered socket BEFORE opening the window
      console.log("[SOCKET] Emitting setSurveying(true) from main window...");
      socket.emit("setSurveying", true);

      console.log("[TAURI] Invoking toggle_survey_window(open=true)...");
      invoke("toggle_survey_window", { open: true })
        .then(() => console.log("[TAURI] toggle_survey_window SUCCESS"))
        .catch((err) => {
          console.error("[TAURI] toggle_survey_window FAILED:", err);
        });
    }

    // Listen for survey-closed Tauri event from the survey window
    // The survey window cannot use the socket directly (unregistered), so it fires this event
    const unlistenSurveyClosed = tauriListen("survey-closed", () => {
      console.log(
        "[TAURI] survey-closed received → emitting setSurveying(false)",
      );
      socket.emit("setSurveying", false);
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("setBlocked", onSetBlocked);
    socket.on("surveyLaunch", onSurveyLaunch);

    // Initial registration if already connected
    if (socket.connected && orgId) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("setBlocked", onSetBlocked);
      socket.off("surveyLaunch", onSurveyLaunch);
      unlistenSurveyClosed.then((fn) => fn());
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, [orgId]);

  // Heartbeat loop
  useEffect(() => {
    if (!isConnected || !orgId) return;

    const interval = setInterval(() => {
      socket.emit("heartbeat");
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, orgId]);

  // Sync blocked state with Rust window manager
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
    return <SurveyContent />;
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
                  (res: { isValid: boolean }) => {
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
            className="w-full py-2 font-medium text-black transition-colors rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-900 disabled:text-zinc-500"
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
          className={`h-2 w-2 rounded-full transition-[background-color,box-shadow] duration-300 ease-in-out ${
            isConnected
              ? "bg-[#10a37f] shadow-[0_0_8px_rgba(16,163,127,0.6)]"
              : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
          }`}
        />
        <span className="text-[13px] font-medium text-zinc-400">
          {isConnected ? "Connected to Server" : "Disconnected"}
        </span>
      </div>
      {!isConnected && (
        <button
          className="mt-3 cursor-pointer rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] font-medium text-[#eeeeee] outline-none transition-all duration-200 ease-in-out hover:border-white/30 hover:bg-white/15 active:translate-y-[1px] active:bg-white/5"
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
