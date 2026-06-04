const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-pro";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function sendMessageToOpenRouter(
  messages: ChatMessage[],
  apiKey: string,
  model = DEFAULT_MODEL
): Promise<string> {
  if (!apiKey) {
    throw new Error("No OpenRouter API key found. Please add it in your Account Settings.");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin, // Optional, for OpenRouter rankings
      "X-Title": "Vicissometer Habit Tracker", // Optional
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to communicate with AI.");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
