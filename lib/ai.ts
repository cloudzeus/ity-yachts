import "server-only"
import { db } from "@/lib/db"

/**
 * One way to ask a model for text.
 *
 * Twelve routes each opened their own fetch with the same body shape, so when
 * the account behind them ran out of credit twelve features died at once and
 * there was no single place to change anything. This is that place.
 *
 * The model is DeepSeek, reached two ways: the DeepSeek account directly, and
 * OpenRouter as the backup. Backup means what it says — if the direct call
 * fails for any reason, credit or outage or a bad key, the same request is
 * retried through OpenRouter rather than surfacing an error to whoever clicked
 * the button. Both speak the same OpenAI-shaped protocol, so they share one
 * function and differ only in host, model id and the attribution headers
 * OpenRouter asks for.
 *
 * Keys live in the settings table rather than the environment, so they stay
 * editable in /admin like the other credentials here.
 */

export type AiRole = "system" | "user" | "assistant"
export interface AiMessage {
  role: AiRole
  content: string
}

/* `deepseek/deepseek-chat` is refused on this account — OpenRouter has no
   allowed upstream for it — and both v4 models return null content, putting
   their answer somewhere other than the content field. v3.2 answers plainly
   and honours response_format, so it is the default. */
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v3.2"

/* Pinned, not aliased. "deepseek-chat" is a moving pointer — today it resolves
   to v4-flash, and DeepSeek can repoint it at v4-pro whenever they ship, which
   on their own price list is the difference between cents and pounds for the
   same traffic. A name we chose cannot change under us without someone
   deciding to change it. */
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash"

interface AiKeys {
  deepseekKey?: string
  deepseekModel?: string
  openrouterKey?: string
  openrouterModel?: string
}

interface Endpoint {
  url: string
  apiKey: string
  model: string
  label: string
  /** Provider-specific body fields — not every endpoint understands them. */
  extra?: Record<string, unknown>
}

async function getKeys(): Promise<AiKeys> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  return ((record?.value ?? {}) as AiKeys) || {}
}

/** DeepSeek first, OpenRouter behind it — in the order they will be tried. */
async function endpoints(): Promise<Endpoint[]> {
  const keys = await getKeys()
  const list: Endpoint[] = []
  if (keys.deepseekKey?.trim()) {
    list.push({
      url: "https://api.deepseek.com/chat/completions",
      apiKey: keys.deepseekKey.trim(),
      model: keys.deepseekModel?.trim() || DEFAULT_DEEPSEEK_MODEL,
      label: "DeepSeek",
      /* Reasoning stays on. Turning it off looked like a large saving and was
         a trap: on a short prompt it answered fine, but on a real conversation
         the model returned forty space characters with finish_reason "stop" —
         not an error, just nothing, on exactly the turns that matter.
         `reasoning_effort: "none"` did the same. The cost is controlled with
         the ceiling instead; see maxTokens below. */
    })
  }
  if (keys.openrouterKey?.trim()) {
    list.push({
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: keys.openrouterKey.trim(),
      model: keys.openrouterModel?.trim() || DEFAULT_OPENROUTER_MODEL,
      label: "OpenRouter",
    })
  }
  return list
}

export type AiProviderName = "deepseek" | "openrouter" | "none"

/** Which route a call will try first — for the settings screen to report. */
export async function aiProvider(): Promise<AiProviderName> {
  const list = await endpoints()
  if (!list.length) return "none"
  return list[0].label === "DeepSeek" ? "deepseek" : "openrouter"
}

/** The model that will answer first, for the same reason. */
export async function aiModel(): Promise<string> {
  const list = await endpoints()
  return list[0]?.model ?? ""
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No AI provider configured — add a DeepSeek or OpenRouter key in Settings → AI")
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
  const list = await endpoints()
  if (!list.length) throw new AiNotConfiguredError()

  const failures: string[] = []
  for (const endpoint of list) {
    try {
      const text = await call({ ...endpoint, messages, maxTokens, temperature, json })
      if (failures.length) console.warn(`[ai] ${endpoint.label} answered after: ${failures.join(" | ")}`)
      return json ? stripFence(text) : text
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err))
    }
  }

  // Every route failed: report all of them, not just the last.
  throw new Error(failures.join(" | "))
}

/** Models wrap JSON in a markdown fence however firmly they are told not to. */
function stripFence(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()
}

async function call({
  url, apiKey, model, label, extra, messages, maxTokens, temperature, json,
}: Endpoint & {
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
      ...(extra ?? {}),
      messages,
    }),
  })

  if (!res.ok) throw new Error(`${label} ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const body = await res.json()
  /* A routed error arrives as HTTP 200 with an error object in the payload. */
  if (body?.error) throw new Error(`${label}: ${String(body.error.message ?? body.error).slice(0, 200)}`)

  /* What the call cost, in the log. DeepSeek bills cached prompt tokens at a
     fraction of fresh ones, and there was no way to tell from here whether the
     cache was being hit at all. */
  const u = body?.usage
  if (u) {
    const hit = u.prompt_cache_hit_tokens ?? 0
    const miss = u.prompt_cache_miss_tokens ?? u.prompt_tokens ?? 0
    const pct = hit + miss > 0 ? Math.round((hit / (hit + miss)) * 100) : 0
    console.log(
      `[ai] ${label}/${model} in ${u.prompt_tokens ?? "?"} (cached ${hit}, ${pct}%) out ${u.completion_tokens ?? "?"}`
    )
  }

  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== "string" || !text.trim())
    throw new Error(`${label} (${model}) returned no text — finish_reason=${body?.choices?.[0]?.finish_reason}`)
  return text.trim()
}
