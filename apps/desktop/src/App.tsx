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
    <main className="container">
      <h1 className="title">Monexa</h1>

      <div className="status-container">
        <div
          className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
        />
        <span className="status-text">
          {isConnected ? "Connected to Server" : "Disconnected"}
        </span>
      </div>
      {!isConnected && (
        <button className="reconnect-button" onClick={() => socket.connect()}>
          Reconnect
        </button>
      )}
    </main>
  );
}

export default App;
