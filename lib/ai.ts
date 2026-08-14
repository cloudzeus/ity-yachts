import "server-only"
import { db } from "@/lib/db"

/**
 * One way to ask a model for text.
 *
 * Twelve routes each opened their own fetch to DeepSeek with the same body
 * shape, so when that account ran out of credit twelve features died at once
 * and there was no single place to change provider. This is that place.
 *
 * Provider order, first key that is set wins:
 *   1. Anthropic — Claude, the primary.
 *   2. OpenRouter — the backup, pointed at DeepSeek.
 *   3. DeepSeek direct — the original account.
 *
 * OpenRouter speaks the same OpenAI-shaped protocol as DeepSeek direct, so the
 * two share a code path and differ only in host, model id and attribution
 * headers. Every key lives in the settings table rather than the environment,
 * so they stay editable in /admin like the other credentials here.
 */

export type AiRole = "system" | "user" | "assistant"
export interface AiMessage {
  role: AiRole
  content: string
}

/** Fast and strong enough for translation and short-form copy; overridable in settings. */
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5"

/* `deepseek/deepseek-chat` is refused on this account — OpenRouter has no
   allowed upstream for it — and the v4 models return their answer in a
   reasoning field rather than as content. v3.2 answers plainly and honours
   response_format, so it is the default. */
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v3.2"

interface AiKeys {
  openrouterKey?: string
  openrouterModel?: string
  anthropicKey?: string
  deepseekKey?: string
  claudeModel?: string
}

async function getKeys(): Promise<AiKeys> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  return ((record?.value ?? {}) as AiKeys) || {}
}

export type AiProviderName = "openrouter" | "deepseek" | "claude" | "none"

/** Which provider a call will actually use — for the settings screen to report. */
export async function aiProvider(): Promise<AiProviderName> {
  const keys = await getKeys()
  if (keys.anthropicKey?.trim()) return "claude"
  if (keys.openrouterKey?.trim()) return "openrouter"
  if (keys.deepseekKey?.trim()) return "deepseek"
  return "none"
}

/** The model that will actually answer, for the same reason. */
export async function aiModel(): Promise<string> {
  const keys = await getKeys()
  if (keys.anthropicKey?.trim()) return keys.claudeModel?.trim() || DEFAULT_CLAUDE_MODEL
  if (keys.openrouterKey?.trim()) return keys.openrouterModel?.trim() || DEFAULT_OPENROUTER_MODEL
  if (keys.deepseekKey?.trim()) return "deepseek-chat"
  return ""
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No AI provider configured — add an Anthropic or DeepSeek key in Settings → AI")
    this.name = "AiNotConfiguredError"
  }
}

export async function aiChat({
  messages,
  maxTokens = 1024,
  temperature,
  json = false,
}: {
  messages: AiMessage[]
  maxTokens?: number
  temperature?: number
  /** The caller will JSON.parse the result, so ask for an object and unwrap fences. */
  json?: boolean
}): Promise<string> {
  const keys = await getKeys()

  const text = keys.anthropicKey?.trim()
    ? await anthropic(keys.anthropicKey.trim(), keys.claudeModel?.trim() || DEFAULT_CLAUDE_MODEL, messages, maxTokens, temperature, json)
    : keys.openrouterKey?.trim()
      ? await openAiShaped({
          url: "https://openrouter.ai/api/v1/chat/completions",
          apiKey: keys.openrouterKey.trim(),
          model: keys.openrouterModel?.trim() || DEFAULT_OPENROUTER_MODEL,
          label: "OpenRouter",
          messages, maxTokens, temperature, json,
        })
      : keys.deepseekKey?.trim()
        ? await openAiShaped({
            url: "https://api.deepseek.com/chat/completions",
            apiKey: keys.deepseekKey.trim(),
            model: "deepseek-chat",
            label: "DeepSeek",
            messages, maxTokens, temperature, json,
          })
        : (() => { throw new AiNotConfiguredError() })()

  return json ? stripFence(text) : text
}

/** Models wrap JSON in a markdown fence however firmly they are told not to. */
function stripFence(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()
}

async function anthropic(
  apiKey: string,
  model: string,
  messages: AiMessage[],
  maxTokens: number,
  temperature: number | undefined,
  json: boolean
): Promise<string> {
  /* The Messages API takes one system string and a turn list of user and
     assistant only. Callers here interleave system messages — a format
     instruction after the transcript, for instance — so those are gathered in
     order into the system block rather than dropped. */
  const parts = messages.filter((m) => m.role === "system").map((m) => m.content)
  /* Anthropic has no response_format, so the instruction has to be said. */
  if (json) parts.push("Respond with a single valid JSON object and nothing else. No prose, no markdown fences.")
  const system = parts.join("\n\n")
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

  // A request needs at least one turn, and it has to start with the user.
  if (!turns.length || turns[0].role !== "user") turns.unshift({ role: "user", content: "Proceed." })

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      ...(temperature != null ? { temperature } : {}),
      messages: turns,
    }),
  })

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`)

  const body = await res.json()
  const text = (body.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim()
  if (!text) throw new Error(`Anthropic returned no text (stop_reason=${body.stop_reason})`)
  return text
}

/** OpenRouter and DeepSeek both speak this; only the host and model differ. */
async function openAiShaped({
  url, apiKey, model, label, messages, maxTokens, temperature, json,
}: {
  url: string
  apiKey: string
  model: string
  label: string
  messages: AiMessage[]
  maxTokens: number
  temperature: number | undefined
  json: boolean
}): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      /* OpenRouter attributes usage to the calling site; harmless elsewhere. */
      "HTTP-Referer": "https://iyc.de",
      "X-Title": "IYC Ionische Yacht Charter",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      ...(temperature != null ? { temperature } : {}),
      messages,
    }),
  })

  if (!res.ok) throw new Error(`${label} ${res.status}: ${(await res.text()).slice(0, 400)}`)

  const body = await res.json()
  /* A routed error arrives as HTTP 200 with an error object in the payload. */
  if (body?.error) throw new Error(`${label}: ${String(body.error.message ?? body.error).slice(0, 300)}`)

  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== "string" || !text.trim())
    throw new Error(`${label} (${model}) returned no text — finish_reason=${body?.choices?.[0]?.finish_reason}`)
  return text.trim()
}
