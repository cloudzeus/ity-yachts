import "server-only"
import { db } from "@/lib/db"

/**
 * One way to ask a model for text.
 *
 * Twelve routes each opened their own fetch to DeepSeek with the same body
 * shape, so when that account ran out of credit twelve features died at once
 * and there was no single place to change provider. This is that place.
 *
 * Claude is used whenever an Anthropic key is configured; DeepSeek stays as a
 * fallback so nothing breaks for an install that only has the old key. Both
 * keys live in the settings table rather than the environment, so they are
 * editable in /admin like every other credential here.
 */

export type AiRole = "system" | "user" | "assistant"
export interface AiMessage {
  role: AiRole
  content: string
}

/** Fast and strong enough for translation and short-form copy; overridable in settings. */
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5"

interface AiKeys {
  anthropicKey?: string
  deepseekKey?: string
  claudeModel?: string
}

async function getKeys(): Promise<AiKeys> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  return ((record?.value ?? {}) as AiKeys) || {}
}

/** Which provider a call will actually use — for the settings screen to report. */
export async function aiProvider(): Promise<"claude" | "deepseek" | "none"> {
  const keys = await getKeys()
  if (keys.anthropicKey?.trim()) return "claude"
  if (keys.deepseekKey?.trim()) return "deepseek"
  return "none"
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
    : keys.deepseekKey?.trim()
      ? await deepseek(keys.deepseekKey.trim(), messages, maxTokens, temperature, json)
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

async function deepseek(
  apiKey: string,
  messages: AiMessage[],
  maxTokens: number,
  temperature: number | undefined,
  json: boolean
): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      ...(temperature != null ? { temperature } : {}),
      messages,
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 400)}`)

  const body = await res.json()
  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== "string" || !text.trim())
    throw new Error(`DeepSeek returned no text (finish_reason=${body?.choices?.[0]?.finish_reason})`)
  return text.trim()
}
