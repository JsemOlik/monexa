export interface Computer {
  id: string;
  name: string;
  os: string;
  status: "online" | "offline";
  lastSeen: number;
  orgId: string;
  isBlocked?: boolean;
  isSurveying?: boolean;
}

export interface SurveyStep {
  id: string;
  type: "star_rating" | "open_paragraph" | "multiple_choice";
  question: string;
  required: boolean;
  options?: string[];
}

export interface SurveyAnswer {
  questionId: string;
  value: string;
}

export interface ServerToClientEvents {
  computerStatusChanged: (computer: Computer) => void;
  setBlocked: (blocked: boolean) => void;
  // Sent when a survey is launched — puts computer in prep/waiting mode
  surveyLaunch: (data: { surveyId: string; launchId: string; surveyTitle: string; style?: string }) => void;
  // Sent when admin starts the survey — computers show the actual questions
  surveyStart: (data: { surveyId: string; launchId: string; steps: SurveyStep[]; style?: string }) => void;
  // Sent when admin cancels a pending survey — closes the survey window
  surveyCancel: (data: { launchId: string }) => void;
}

export interface ClientToServerEvents {
  registerComputer: (computer: Omit<Computer, "status" | "lastSeen">) => void;
  launchSurvey: (data: { surveyId: string; launchId: string; targets: string[] }) => void;
  startSurvey: (data: { launchId: string; survey: any; targets: string[] }) => void;
  cancelSurvey: (data: { launchId: string; targets: string[] }) => void;
  heartbeat: () => void;
  validateOrg: (data: { orgId: string }, callback: (res: { isValid: boolean }) => void) => void;
  setSurveying: (surveying: boolean) => void;
  submitSurveyResponse: (data: { launchId: string; surveyId: string; answers: SurveyAnswer[] }) => void;
}
