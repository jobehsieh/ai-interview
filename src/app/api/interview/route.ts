import { callOpenCodeGo } from "@/lib/opencode-go";
import type { ChatMessage, InterviewRequestBody } from "@/lib/interview-types";
import { MAX_TOTAL_QUESTIONS, MIN_TOTAL_QUESTIONS } from "@/lib/interview-types";

export const runtime = "nodejs";

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function buildSuggestionPrompt(
  jobDescription: string,
  lastQuestion: string,
  lastAnswer: string,
) {
  return `你是一位經驗豐富、態度友善的面試教練。以下是本次模擬面試的職缺描述：

${jobDescription}

面試官剛剛問了以下問題：
「${lastQuestion}」

候選人的回答是：
「${lastAnswer}」

請針對這一題，給候選人一個簡短但具體的「更好的回答方式」建議，例如可以補充哪些重點、如何讓回答更有結構或更有說服力。請直接輸出建議內容本身，使用繁體中文，控制在 150 字以內，不要重複問題或回答的原文，也不要出現「以下是建議」等開場白。`;
}

function buildNextStepPrompt(
  jobDescription: string,
  questionCount: number,
  totalQuestions: number,
  isFinalStage: boolean,
) {
  if (isFinalStage) {
    return `你是一位經驗豐富、態度專業但友善的技術面試官。以下是這個職缺的描述：

${jobDescription}

你已經針對這個職缺向候選人提出了 ${totalQuestions} 個面試問題，並得到候選人的回答（詳見對話紀錄）。請根據完整的問答紀錄，給予候選人一份面試評估報告，內容需包含：
1. 總體評分（滿分 10 分）
2. 各項能力評分與說明（例如：專業知識、邏輯思考、表達能力，可依職缺內容調整項目）
3. 具體優點
4. 具體待加強之處與建議

請直接輸出評估報告本身，使用繁體中文，並用清楚的段落或條列呈現，不要再提出新的問題。`;
  }

  return `你是一位經驗豐富、態度專業但友善的技術面試官，正在針對以下職缺進行模擬面試：

${jobDescription}

這是第 ${questionCount + 1} 題，總共會問 ${totalQuestions} 題。請根據職缺內容與先前的問答紀錄（若有），提出「一個」切題且有深度的面試問題，可視情況針對候選人先前的回答追問細節，但不要重複先前問過的問題。請只輸出這一題的題目本身，使用繁體中文，不要加上「第 X 題」等標籤，也不要附加其他說明或答案。`;
}

export async function POST(request: Request) {
  let body: InterviewRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const { jobDescription, history, questionCount, totalQuestions, sessionId } =
    body;

  if (typeof jobDescription !== "string" || !jobDescription.trim()) {
    return Response.json({ error: "請提供職缺描述" }, { status: 400 });
  }
  if (!Array.isArray(history) || !history.every(isChatMessage)) {
    return Response.json({ error: "對話紀錄格式錯誤" }, { status: 400 });
  }
  if (typeof questionCount !== "number" || questionCount < 0) {
    return Response.json({ error: "題號格式錯誤" }, { status: 400 });
  }
  if (
    typeof totalQuestions !== "number" ||
    !Number.isInteger(totalQuestions) ||
    totalQuestions < MIN_TOTAL_QUESTIONS ||
    totalQuestions > MAX_TOTAL_QUESTIONS
  ) {
    return Response.json(
      {
        error: `面試題數需為 ${MIN_TOTAL_QUESTIONS} 到 ${MAX_TOTAL_QUESTIONS} 之間的整數`,
      },
      { status: 400 },
    );
  }
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return Response.json({ error: "缺少 sessionId" }, { status: 400 });
  }

  const isFinalStage = questionCount >= totalQuestions;

  const nextStepMessages = [
    {
      role: "system" as const,
      content: buildNextStepPrompt(
        jobDescription,
        questionCount,
        totalQuestions,
        isFinalStage,
      ),
    },
    ...history,
  ];

  // 只有在候選人至少回答過一題時才需要產生「更好的回答方式」建議。
  const lastAnswer = history.at(-1);
  const lastQuestion = history.at(-2);
  const shouldSuggest =
    questionCount > 0 &&
    lastAnswer?.role === "user" &&
    lastQuestion?.role === "assistant";

  const suggestionMessages = shouldSuggest
    ? [
        {
          role: "system" as const,
          content: buildSuggestionPrompt(
            jobDescription,
            lastQuestion!.content,
            lastAnswer!.content,
          ),
        },
        { role: "user" as const, content: "請提供這一題回答的具體建議。" },
      ]
    : null;

  let replyContent: string;
  let suggestion: string | undefined;
  try {
    const [nextStepResult, suggestionResult] = await Promise.all([
      callOpenCodeGo(nextStepMessages, sessionId),
      suggestionMessages
        ? callOpenCodeGo(suggestionMessages, sessionId)
        : Promise.resolve(undefined),
    ]);
    replyContent = nextStepResult;
    suggestion = suggestionResult;
  } catch (error) {
    console.error("OpenCode Go API error:", error);
    return Response.json(
      { error: "呼叫 AI 面試官服務失敗，請稍後再試" },
      { status: 502 },
    );
  }

  if (isFinalStage) {
    return Response.json({ type: "final", content: replyContent, suggestion });
  }

  return Response.json({
    type: "question",
    content: replyContent,
    questionCount: questionCount + 1,
    suggestion,
  });
}
