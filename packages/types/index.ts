export interface Computer {
  id: string;
  name: string;
  os: string;
  status: "online" | "offline";
  lastSeen: number; // Changed to number for epoch consistency
  orgId: string;
  isBlocked?: boolean;
  isSurveying?: boolean;
}

export interface ServerToClientEvents {
  computerStatusChanged: (computer: Computer) => void;
  setBlocked: (blocked: boolean) => void;
  surveyLaunch: (data: { surveyId: string }) => void;
}

export interface ClientToServerEvents {
  registerComputer: (computer: Omit<Computer, "status" | "lastSeen">) => void;
  launchSurvey: (data: { surveyId: string; targets: string[] }) => void;
  heartbeat: () => void;
  validateOrg: (data: { orgId: string }, callback: (res: { isValid: boolean }) => void) => void;
  setSurveying: (surveying: boolean) => void;
}
