// 這個檔案是「AI 面試模擬器」的主要互動頁面（路由：/interview）。
// 標記為 Client Component，因為裡面用到 useState / useRef 等只能在瀏覽器端運作的 React Hook，
// 以及會綁定按鈕點擊、輸入框變化等使用者互動事件。
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
// 從共用型別檔案匯入「訊息」與「API 回應」的型別定義，確保前後端資料格式一致。
import type {
  ChatMessage,
  InterviewResponseBody,
} from "@/lib/interview-types";
// 匯入題數相關的常數：預設題數、允許的最小/最大題數，避免在多處寫死魔術數字。
import {
  DEFAULT_TOTAL_QUESTIONS,
  MAX_TOTAL_QUESTIONS,
  MIN_TOTAL_QUESTIONS,
} from "@/lib/interview-types";

// 定義整個面試流程的三個階段：
// - setup：使用者尚未開始，正在填寫職缺描述與題數
// - interviewing：面試進行中，AI 正在逐題提問、使用者逐題作答
// - finished：所有題目都回答完畢，顯示最終評分報告
type Stage = "setup" | "interviewing" | "finished";

// InterviewResponseBody 是「成功或失敗」的聯合型別（可能是 question / final，也可能是 error）。
// 這裡用 Exclude 把 { error: string } 這個錯誤形狀排除掉，
// 得到「呼叫成功時一定會拿到的資料形狀」，讓後面使用 result.type、result.content 時不會被 TypeScript 擋下來。
type InterviewSuccessBody = Exclude<InterviewResponseBody, { error: string }>;

// 統一封裝呼叫 /api/interview 的邏輯，供「開始面試」與「送出回答」共用。
async function requestInterview(payload: {
  jobDescription: string; // 職缺描述全文
  history: ChatMessage[]; // 目前為止的完整問答紀錄（assistant 問題 + user 回答交錯）
  questionCount: number; // 目前已經問過幾題（給後端判斷下一步要出題還是收尾）
  totalQuestions: number; // 使用者設定的總題數
  sessionId: string; // 同一場面試共用的識別碼，讓 OpenCode Go 能做路由與快取優化
}): Promise<InterviewSuccessBody> {
  // 呼叫自家後端 API route（見 src/app/api/interview/route.ts），而不是直接呼叫 OpenCode Go，
  // 這樣可以把金鑰與 prompt 邏輯留在伺服器端，不會外洩到瀏覽器。
  const res = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // 不論成功或失敗，後端都會回傳 JSON，所以先統一解析出來再判斷。
  const data: InterviewResponseBody = await res.json();

  // 兩種失敗情況都要丟出例外，交給呼叫端的 try/catch 統一處理：
  // 1. res.ok 為 false（HTTP 狀態碼非 2xx，例如 400/502）
  // 2. 就算 HTTP 狀態碼是 200，但回傳內容裡帶了 error 欄位（目前後端不會這樣做，但保留這層防呆）
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "發生未知錯誤");
  }

  // 走到這裡代表一定是成功的 question 或 final 回應。
  return data;
}

// 小型展示元件：依照訊息角色（AI 或使用者）畫出不同樣式的圓形頭像。
// 抽成獨立元件是因為聊天列表跟「AI 思考中...」的 loading 狀態都需要重複使用同一個頭像樣式。
function Avatar({ role }: { role: ChatMessage["role"] }) {
  if (role === "assistant") {
    // AI 頭像：漸層背景圓形 + 文字「AI」
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-bold text-white">
        AI
      </span>
    );
  }
  // 使用者頭像：灰底圓形 + 文字「你」
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      你
    </span>
  );
}

// 頁面主元件。Next.js App Router 規定 app/interview/page.tsx 預設匯出的元件
// 就是 /interview 這個路由實際渲染的內容。
export default function InterviewPage() {
  // ---- 以下是這個頁面所有的狀態（state） ----

  // 使用者輸入的職缺描述文字（多行文字框）
  const [jobDescription, setJobDescription] = useState("");
  // 使用者設定的面試總題數，預設值來自共用常數 DEFAULT_TOTAL_QUESTIONS
  const [totalQuestions, setTotalQuestions] = useState(
    DEFAULT_TOTAL_QUESTIONS,
  );
  // 目前畫面所在的階段，一開始一定是 "setup"
  const [stage, setStage] = useState<Stage>("setup");
  // 完整的對話紀錄（AI 問題與使用者回答交錯的陣列），會原封不動送給後端當作 history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 目前已經「出過」幾題（不是使用者答了幾題，而是 AI 已經問到第幾題）
  const [questionCount, setQuestionCount] = useState(0);
  // 使用者正在輸入、尚未送出的回答內容（綁定到回答用的 textarea）
  const [currentAnswer, setCurrentAnswer] = useState("");
  // 是否正在等待後端回應，用來讓按鈕顯示 loading 文字、避免重複送出
  const [loading, setLoading] = useState(false);
  // 呼叫 API 失敗時要顯示的錯誤訊息；沒有錯誤時是 null
  const [error, setError] = useState<string | null>(null);
  // 面試結束後，AI 給的完整評分報告文字
  const [finalReport, setFinalReport] = useState<string | null>(null);
  // 最後一題的「更好的回答方式」建議（因為最後一題答完後不會再進入 interviewing 階段，
  // 所以它的建議要單獨存起來，顯示在最終報告畫面）
  const [finalSuggestion, setFinalSuggestion] = useState<string | null>(null);
  // 存放「每一題」的回答建議。
  // key：該建議所對應的候選人回答在 messages 陣列中的 index
  // value：AI 針對那一題回答給的「更好的回答方式」建議文字
  // 用 index 當 key 是因為 messages 陣列的順序在同一場面試中是穩定的，
  // 可以精準地把建議顯示在「使用者當初那則回答」的下方。
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});
  // 用 useRef 而非 useState 存 sessionId，因為它只是要在多次 API 呼叫之間保持穩定的值，
  // 改變它不需要觸發畫面重新渲染，用 ref 可以避免不必要的 re-render。
  const sessionIdRef = useRef<string>("");

  // ---- 按下「開始模擬面試」時執行 ----
  async function handleStart() {
    // 防呆：職缺描述是空字串（或全是空白）就不送出；已經在 loading 中也不重複觸發。
    if (!jobDescription.trim() || loading) return;
    setLoading(true);
    setError(null);
    // 每次「開始一場新面試」都重新產生一組 UUID 當作 session id，
    // 讓 OpenCode Go 能把同一場面試的多次請求視為同一個對話，做路由與 prompt 快取優化。
    sessionIdRef.current = crypto.randomUUID();
    try {
      // 第一次呼叫：history 是空陣列（還沒有任何問答），questionCount 是 0，
      // 後端看到 questionCount(0) < totalQuestions，就知道要出「第一題」。
      const result = await requestInterview({
        jobDescription,
        history: [],
        questionCount: 0,
        totalQuestions,
        sessionId: sessionIdRef.current,
      });
      // 正常情況下第一次呼叫一定會拿到 "question"（不可能一開始就是 final）。
      if (result.type === "question") {
        // 把 AI 出的第一題放進訊息陣列，畫面上會顯示成一則 AI 的聊天泡泡。
        setMessages([{ role: "assistant", content: result.content }]);
        // 後端回傳的 questionCount 已經是「+1」後的值（代表現在已經出了幾題）。
        setQuestionCount(result.questionCount);
        // 切換到「面試進行中」畫面。
        setStage("interviewing");
      }
    } catch (err) {
      // 統一的錯誤處理：如果是 Error 物件就顯示它的 message，否則顯示通用錯誤字串。
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      // 不論成功或失敗，最後都要把 loading 關掉。
      setLoading(false);
    }
  }

  // ---- 按下「送出回答」時執行 ----
  async function handleSubmitAnswer() {
    // 防呆：回答是空的，或正在等待前一個請求時，不允許送出。
    if (!currentAnswer.trim() || loading) return;
    setLoading(true);
    setError(null);

    // 把使用者剛輸入的回答加到既有的 messages 陣列尾端，組成「下一步要送給後端」的完整歷史紀錄。
    // 這裡先在前端組好 nextHistory，而不是等後端回應才更新，
    // 目的是讓使用者的回答「立刻」顯示在聊天畫面上（樂觀更新 UI），不用等 API 回來才看到自己剛打的字。
    const nextHistory: ChatMessage[] = [
      ...messages,
      { role: "user", content: currentAnswer },
    ];
    // 記錄「這則回答」在 nextHistory 陣列中的 index，
    // 之後如果 API 回傳這一題的建議，就知道要把建議掛在哪一則訊息下面。
    const answeredMessageIndex = nextHistory.length - 1;
    // 先用包含這則新回答的陣列更新畫面（使用者馬上看到自己送出的內容）。
    setMessages(nextHistory);
    // 清空輸入框，準備讓使用者打下一題的回答。
    setCurrentAnswer("");

    try {
      // 把「包含最新回答」的完整歷史紀錄與目前的 questionCount 送給後端。
      // 後端會依據 questionCount 是否已經達到 totalQuestions，決定要「再出一題」還是「產生總評」。
      const result = await requestInterview({
        jobDescription,
        history: nextHistory,
        questionCount,
        totalQuestions,
        sessionId: sessionIdRef.current,
      });

      // 不論這次回應是「下一題」還是「最終評分」，只要後端有附帶 suggestion，
      // 就代表這是「針對使用者剛剛那則回答」的建議，要記錄起來。
      if (result.suggestion) {
        setSuggestions((prev) => ({
          ...prev, // 保留之前累積的所有建議
          [answeredMessageIndex]: result.suggestion!, // 加上這一題的建議
          // 這裡用 ! 是因為上面的 if (result.suggestion) 已經確保它不是 undefined，
          // 只是 TypeScript 在這個閉包情境下無法自動窄化型別，所以手動斷言。
        }));
      }

      if (result.type === "question") {
        // 還沒問完：把 AI 出的下一題接在 nextHistory 後面，形成新的完整訊息陣列。
        setMessages([
          ...nextHistory,
          { role: "assistant", content: result.content },
        ]);
        // 更新目前已出的題數，畫面上的進度條 / 「第 X / Y 題」文字會跟著更新。
        setQuestionCount(result.questionCount);
      } else {
        // 已經是最後一題的回答：後端回傳的是 "final"，也就是整份評分報告。
        setFinalReport(result.content);
        // 順便存下最後一題的建議（有可能沒有，所以用 ?? null 給預設值）。
        setFinalSuggestion(result.suggestion ?? null);
        // 切換到「結束」畫面，顯示評分報告。
        setStage("finished");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  // ---- 按下「再練一次」時執行：把所有狀態重置回最初的樣子 ----
  function handleRestart() {
    setJobDescription("");
    setTotalQuestions(DEFAULT_TOTAL_QUESTIONS);
    setStage("setup");
    setMessages([]);
    setQuestionCount(0);
    setCurrentAnswer("");
    setError(null);
    setFinalReport(null);
    setFinalSuggestion(null);
    setSuggestions({});
    // 注意：sessionIdRef 不用在這裡清空，因為下次按「開始模擬面試」時
    // handleStart 會直接產生一組新的 UUID 覆蓋掉它。
  }

  // 計算目前的作答進度百分比，給進度條與文字顯示使用。
  // 在 "setup" 階段（都還沒開始問）固定顯示 0%，避免 questionCount / totalQuestions 在初始狀態下產生奇怪的數字。
  const progressPercent =
    stage === "setup" ? 0 : Math.round((questionCount / totalQuestions) * 100);

  // ---- 以下是畫面渲染（JSX） ----
  return (
    // 最外層容器：relative 讓裡面的漸層背景可以用 absolute 定位；
    // flex-1 讓這個頁面在 RootLayout 的 flex 版面中撐滿剩餘高度。
    <div className="relative flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      {/* 純裝飾用的背景光暈：用放射狀漸層在頁面最上方畫出一個柔和的靛色光暈，
          pointer-events-none 確保它不會擋到底下元素的滑鼠事件，-z-10 把它壓到內容後面。 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.100),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.indigo.950),transparent)]" />

      {/* 頁面頂部的極簡導覽列：左邊是「返回首頁」連結，右邊是品牌 Logo + 名稱。
          這裡沒有用共用的 SiteHeader，是因為面試工具頁想要更聚焦、簡潔的頂列，
          不需要行銷首頁那種完整的導覽選單。 */}
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <span aria-hidden>←</span>
          返回首頁
        </Link>
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-bold text-white">
            AI
          </span>
          AI Interview
        </span>
      </div>

      {/* 主要內容區：置中、限制最大寬度，讓內容在寬螢幕上不會被拉得太寬。 */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 pb-16">
        {/* 頁面標題與說明文字，三個階段共用，不會隨 stage 改變。 */}
        <header className="flex flex-col gap-1.5 pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            AI 模擬面試
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            輸入職缺描述並設定題數，AI
            面試官將逐題提問，每題回答後提供更好的回答建議，全部答完後給予總評分與建議。
          </p>
        </header>

        {/* 錯誤訊息區塊：只有 error 狀態有值時才會渲染（React 的短路運算式 && 寫法）。 */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* ---------------- 階段一：setup（填寫職缺描述與題數） ---------------- */}
        {stage === "setup" && (
          <div className="flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {/* 職缺描述輸入框：受控元件（controlled component），
                value 綁定 state、onChange 更新 state，兩者保持同步。 */}
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              職缺描述
              <textarea
                className="min-h-40 rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="請貼上或輸入職缺描述，例如：職稱、必備技能、工作內容..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </label>
            {/* 題數輸入框：type="number"，並在 onChange 裡手動做範圍限制（clamp），
                確保使用者不會輸入超出 1~10（或設定的 MIN/MAX）範圍的數字。 */}
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              面試題數（{MIN_TOTAL_QUESTIONS} ~ {MAX_TOTAL_QUESTIONS} 題）
              <input
                type="number"
                className="w-24 rounded-xl border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                min={MIN_TOTAL_QUESTIONS}
                max={MAX_TOTAL_QUESTIONS}
                value={totalQuestions}
                onChange={(e) => {
                  // 輸入框的值永遠是字串，要先轉成數字。
                  const value = Number(e.target.value);
                  // 使用者可能清空輸入框（此時 e.target.value 是 ""，Number("") 會是 0，
                  // 但如果輸入非數字字元，瀏覽器的 number input 通常會擋掉；
                  // 這裡再做一層 NaN 防呆，避免把 NaN 存進 state）。
                  if (Number.isNaN(value)) return;
                  // 把輸入值限制在 [MIN_TOTAL_QUESTIONS, MAX_TOTAL_QUESTIONS] 之間，
                  // 並四捨五入成整數，避免出現 3.5 題這種不合理的值。
                  const clamped = Math.min(
                    MAX_TOTAL_QUESTIONS,
                    Math.max(MIN_TOTAL_QUESTIONS, Math.round(value)),
                  );
                  setTotalQuestions(clamped);
                }}
              />
            </label>
            {/* 開始按鈕：職缺描述為空，或正在 loading 時停用（disabled），避免重複觸發或送出空白內容。 */}
            <button
              className="self-start rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleStart}
              disabled={!jobDescription.trim() || loading}
            >
              {loading ? "準備問題中..." : "開始模擬面試"}
            </button>
          </div>
        )}

        {/* ---------------- 階段二：interviewing（面試進行中） ---------------- */}
        {stage === "interviewing" && (
          <div className="flex flex-col gap-4">
            {/* 進度條區塊：顯示「第 X / Y 題」文字，以及對應百分比的橫向進度條。 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span>
                  第 {questionCount} / {totalQuestions} 題
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                {/* 進度條的「已完成」部分，用 inline style 動態設定寬度百分比，
                    因為這個寬度是隨 state 變化的數值，沒辦法用固定的 Tailwind class 表示。 */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 聊天紀錄卡片：把 messages 陣列逐一渲染成聊天泡泡。 */}
            <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              {messages.map((message, index) => (
                // 用陣列 index 當 React key：因為這個列表只會在尾端新增訊息、不會重新排序或刪除中間項目，
                // 所以用 index 當 key 是安全的（不會有一般用 index 當 key 常見的排序錯亂問題）。
                <div key={index} className="flex flex-col gap-2">
                  <div
                    className={
                      message.role === "assistant"
                        // AI 的訊息：靠左對齊（self-start），頭像在文字左邊（預設的 flex 方向）。
                        ? "flex items-start gap-2.5 self-start"
                        // 使用者的訊息：靠右對齊（self-end），用 flex-row-reverse 把頭像換到文字右邊。
                        : "flex flex-row-reverse items-start gap-2.5 self-end"
                    }
                  >
                    <Avatar role={message.role} />
                    <div
                      className={
                        message.role === "assistant"
                          // AI 泡泡：淺灰底、深色文字，左上角是直角（rounded-tl-sm）製造「從頭像那邊長出來」的效果。
                          ? "max-w-[80%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                          // 使用者泡泡：靛色底、白色文字，右上角是直角，呼應右側頭像。
                          : "max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm text-white"
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                  {/* 如果 suggestions 這個 Record 裡，剛好有對應這則訊息 index 的建議，
                      就在這則訊息下方額外渲染一個琥珀色的提示框。
                      因為 suggestions 的 key 是「使用者回答」的 index，
                      所以只有使用者的回答泡泡下面才會出現這個建議框（AI 的問題泡泡不會有）。 */}
                  {suggestions[index] && (
                    <div className="ml-9 max-w-[80%] self-end rounded-2xl rounded-tr-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        更好的回答方式
                      </div>
                      {suggestions[index]}
                    </div>
                  )}
                </div>
              ))}
              {/* loading 中會額外顯示一個「面試官思考中...」的假泡泡，
                  讓使用者知道系統正在等待 AI 回應，而不是畫面卡住。 */}
              {loading && (
                <div className="flex items-start gap-2.5 self-start">
                  <Avatar role="assistant" />
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 text-sm text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                    面試官思考中...
                  </div>
                </div>
              )}
            </div>

            {/* 回答輸入區：文字框 + 送出按鈕，皆為受控元件。 */}
            <div className="flex flex-col gap-2 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              <textarea
                className="min-h-28 rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="輸入你的回答..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                // 等待 API 回應時鎖住輸入框，避免使用者在還沒拿到下一題前繼續打字造成混淆。
                disabled={loading}
              />
              <button
                className="self-start rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmitAnswer}
                // 回答是空白，或正在等待回應時停用按鈕。
                disabled={!currentAnswer.trim() || loading}
              >
                {loading ? "送出中..." : "送出回答"}
              </button>
            </div>
          </div>
        )}

        {/* ---------------- 階段三：finished（顯示最終評分報告） ----------------
            這裡的條件同時檢查 stage === "finished" 「且」 finalReport 有值，
            是為了滿足 TypeScript 的型別窄化：進到這個區塊之後，
            finalReport 會被視為 string 而不是 string | null，下面才能直接把它當文字渲染。 */}
        {stage === "finished" && finalReport && (
          <div className="flex flex-col gap-4">
            {/* 最後一題的回答建議（如果有的話），顯示在報告上方。 */}
            {finalSuggestion && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  最後一題：更好的回答方式
                </div>
                {finalSuggestion}
              </div>
            )}
            {/* 評分報告本體：whitespace-pre-wrap 讓 AI 回傳文字裡的換行符號（\n）能正確顯示成多行，
                而不是被 HTML 預設的空白摺疊規則吃掉。 */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm leading-relaxed whitespace-pre-wrap text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
              {finalReport}
            </div>
            {/* 底部兩顆行動按鈕：「再練一次」呼叫 handleRestart 重置所有狀態、留在同一頁；
                「返回首頁」則是用 Next.js 的 Link 導覽到行銷首頁 "/"。 */}
            <div className="flex gap-3">
              <button
                className="self-start rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
                onClick={handleRestart}
              >
                再練一次
              </button>
              <Link
                href="/"
                className="self-start rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                返回首頁
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
