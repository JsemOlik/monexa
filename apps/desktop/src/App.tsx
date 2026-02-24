import { useEffect, useState } from "react";
import { socket } from "./lib/socket";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

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
