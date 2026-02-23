export interface Computer {
  id: string;
  name: string;
  os: string;
  status: "online" | "offline";
  lastSeen: Date;
}

export interface ServerToClientEvents {
  computerStatusChanged: (computer: Computer) => void;
}

export interface ClientToServerEvents {
  registerComputer: (computer: Omit<Computer, "status" | "lastSeen">) => void;
}
