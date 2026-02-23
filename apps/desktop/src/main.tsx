import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initSocket } from "./lib/socket";

initSocket();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
