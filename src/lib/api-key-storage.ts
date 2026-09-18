const STORAGE_KEY = "ai-interview:opencode-api-key";

export function getStoredApiKey(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredApiKey(apiKey: string): void {
  try {
    if (apiKey) {
      window.localStorage.setItem(STORAGE_KEY, apiKey);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 瀏覽器封鎖 localStorage（例如無痕模式）時安靜失敗即可，不影響當次操作。
  }
}
