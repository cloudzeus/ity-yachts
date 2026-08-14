import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"
import { AiNotConfiguredError, aiChat, aiModel, aiProvider } from "@/lib/ai"

/**
 * Proves the configured key actually works, by asking for a real translation.
 *
 * A saved key that turns out to be wrong is only discovered when a colleague
 * clicks Translate and gets an error — this makes it discoverable at the point
 * the key is entered, the way the NAUSYS and email tabs already do.
 */
export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const provider = await aiProvider()
    if (provider === "none") {
      return NextResponse.json({ ok: false, message: "No key saved yet. Enter a key and save first." })
    }

    const started = Date.now()
    const reply = await aiChat({
      messages: [
        { role: "system", content: "Translate the user's text into German. Reply with the translation only." },
        { role: "user", content: "The yacht has four cabins and sails from Lefkada." },
      ],
      maxTokens: 100,
      temperature: 0,
    })

    const ms = Date.now() - started
    const model = await aiModel()
    const name = provider === "claude" ? "Claude" : provider === "openrouter" ? "OpenRouter" : "DeepSeek"
    return NextResponse.json({
      ok: true,
      provider,
      model,
      ms,
      message: `${name} (${model}) answered in ${ms} ms: "${reply.slice(0, 160)}"`,
    })
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ ok: false, message: err.message })
    }
    // The provider's own message is the useful part — a bad key, no credit.
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[ai-test]", detail)
    return NextResponse.json({ ok: false, message: detail.slice(0, 300) })
  }
}
