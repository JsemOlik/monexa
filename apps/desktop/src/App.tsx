import { useEffect, useState, useRef } from "react";
import { socket } from "./lib/socket";
import { invoke } from "@tauri-apps/api/core";
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Your computer is blocked</h1>
          <p className="text-zinc-400 text-lg">Please contact your administrator for further details.</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isBlocked, setIsBlocked] = useState(false);
  const isBlockedWindow = window.location.hash === "#/blocked";
  const disconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      // If we don't reconnect within 10 seconds, close all secondary windows
      disconnectTimeoutRef.current = setTimeout(() => {
        invoke("close_secondary_windows").catch(console.error);
      }, 10000);
    }

    function onSetBlocked(blocked: boolean) {
      setIsBlocked(blocked);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("setBlocked" as any, onSetBlocked);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("setBlocked" as any, onSetBlocked);
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, []);

  // Heartbeat loop
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      socket.emit("heartbeat" as any);
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Sync blocked state with Rust window manager
  useEffect(() => {
    if (!isBlockedWindow) {
      invoke("toggle_block_window", { blocked: isBlocked }).catch(console.error);
    }
  }, [isBlocked, isBlockedWindow]);

  if (isBlockedWindow) {
    return <BlockedContent />;
  }

  return (
    <main className="m-0 flex flex-col items-center justify-center gap-3 text-center">
      <h1 className="m-0 text-2xl font-bold tracking-tight text-white">
        Monexa
      </h1>

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
    </main>
  );
}

export default App;
