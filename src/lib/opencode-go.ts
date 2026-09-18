interface OpenCodeGoMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenCodeGoChatCompletion {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

async function requestChatCompletion(
  messages: OpenCodeGoMessage[],
  sessionId: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<Response> {
  return fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-opencode-session": sessionId,
      "User-Agent": "ai-interview/1.0",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });
}

export async function callOpenCodeGo(
  messages: OpenCodeGoMessage[],
  sessionId: string,
): Promise<string> {
  const apiKey = process.env.OpenCode_GO_KEY;
  const baseUrl = process.env.OPENCODE_GO_BASE_URL;
  const model = process.env.OPENCODE_GO_MODEL;

  if (!apiKey) {
    throw new Error("缺少環境變數 OpenCode_GO_KEY");
  }
  if (!baseUrl) {
    throw new Error("缺少環境變數 OPENCODE_GO_BASE_URL，請於 .env.local 設定");
  }
  if (!model) {
    throw new Error("缺少環境變數 OPENCODE_GO_MODEL，請於 .env.local 設定");
  }

  // OpenCode Go 偶爾會回傳暫時性的 5xx 錯誤，重試一次即可恢復。
  let response = await requestChatCompletion(
    messages,
    sessionId,
    apiKey,
    baseUrl,
    model,
  );
  if (!response.ok && response.status >= 500) {
    response = await requestChatCompletion(
      messages,
      sessionId,
      apiKey,
      baseUrl,
      model,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenCode Go API 回傳錯誤 (${response.status}): ${text}`);
  }

  const data: OpenCodeGoChatCompletion = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenCode Go API 回傳內容為空");
  }

  return content.trim();
}
