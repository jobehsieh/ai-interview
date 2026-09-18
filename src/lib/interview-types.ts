export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface InterviewRequestBody {
  jobDescription: string;
  history: ChatMessage[];
  questionCount: number;
  totalQuestions: number;
  sessionId: string;
}

export type InterviewResponseBody =
  | {
      type: "question";
      content: string;
      questionCount: number;
      suggestion?: string;
    }
  | { type: "final"; content: string; suggestion?: string }
  | { error: string };

export const DEFAULT_TOTAL_QUESTIONS = 3;
export const MIN_TOTAL_QUESTIONS = 1;
export const MAX_TOTAL_QUESTIONS = 10;
