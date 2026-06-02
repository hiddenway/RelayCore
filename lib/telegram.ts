import { decryptToken } from "./crypto";
import type { TelegramBot, RelayEventInput, DeliveryResult } from "@/types";

const TELEGRAM_API = "https://api.telegram.org";

const LEVEL_EMOJI: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export function formatMessage(routeName: string, event: RelayEventInput): string {
  const emoji = LEVEL_EMOJI[event.level ?? "info"];
  const level = (event.level ?? "info").toUpperCase();
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

  let text = `${emoji} <b>[${level}] ${escapeHtml(event.title ?? routeName)}</b>\n`;
  text += `<code>Route: ${escapeHtml(routeName)}</code>\n`;
  text += `<code>Time:  ${timestamp}</code>\n`;

  if (event.message) {
    // message is passed as-is — HTML tags are rendered by Telegram (parse_mode: HTML)
    text += `\n${event.message}\n`;
  }

  if (event.payload) {
    const payloadStr = typeof event.payload === "string"
      ? event.payload
      : JSON.stringify(event.payload, null, 2);
    if (payloadStr.trim().length > 0) {
      text += `\n<pre>${escapeHtml(payloadStr)}</pre>`;
    }
  }

  return text;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(
  bot: TelegramBot,
  chatId: string,
  text: string,
  threadId?: string
): Promise<DeliveryResult> {
  const result: DeliveryResult = { botId: bot.id, chatId, success: false };
  try {
    const token = decryptToken(bot.tokenEncrypted);
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (threadId) body.message_thread_id = parseInt(threadId, 10);
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };
    if (data.ok) {
      result.success = true;
      result.messageId = data.result?.message_id;
    } else {
      result.error = data.description ?? "Unknown error";
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Network error";
  }
  return result;
}

export async function validateBotToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/getMe`);
    const data = await response.json() as { ok: boolean; result?: { username: string }; description?: string };
    if (data.ok) {
      return { valid: true, username: data.result?.username };
    }
    return { valid: false, error: data.description };
  } catch {
    return { valid: false, error: "Network error" };
  }
}
