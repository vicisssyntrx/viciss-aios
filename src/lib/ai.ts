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
    headers["X-Title"] = "Viciss AIOS Habit Tracker";
  }

  const bodyPayload: Record<string, unknown> = {
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

export async function summarizeMemory(
  provider: AIProvider,
  apiKey: string,
  model: string,
  existingMemory: string,
  recentMessages: ChatMessage[]
): Promise<string> {
  const systemPrompt = `You are an AI tasked with maintaining a user's long-term memory for an accountability app.
Your job is to read the current memory and the recent chat history, then extract any new, important facts, goals, preferences, or personal details about the user.
Update the memory with these new facts. The output must be concise and beautifully formatted in Markdown.
CRITICAL INSTRUCTION:
- If the memory gets too long, compress older facts into dense bullet points.
- The user's database has limited space, so keep the summary as short as possible while retaining the core facts spanning up to 2 years.
- Only output the updated markdown memory. Do not include any conversational filler like "Here is the memory:".`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `CURRENT MEMORY:\n${existingMemory || "No existing memory."}\n\nRECENT CHAT HISTORY:\n${recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}` }
  ];

  return await sendMessageToAI(messages, provider, apiKey, model);
}
