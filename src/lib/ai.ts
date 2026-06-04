const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export type AIProvider = "openrouter" | "google";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function sendMessageToAI(
  messages: ChatMessage[],
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<string> {
  if (!apiKey) {
    throw new Error(`No API key found for ${provider}. Please add it in your Account Settings.`);
  }
  if (!model) {
    throw new Error(`No Model ID provided for ${provider}. Please add it in your Account Settings.`);
  }

  const apiUrl = provider === "google" ? GOOGLE_API_URL : OPENROUTER_API_URL;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey.trim()}`,
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Vicissometer Habit Tracker";
  }

  const bodyPayload: any = {
    model: model.trim(),
    messages,
    max_tokens: 2000,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to communicate with ${provider}.`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
