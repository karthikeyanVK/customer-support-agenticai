// Types shared between the frontend and the API route

export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
}
