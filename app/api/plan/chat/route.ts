import { NextRequest, NextResponse } from "next/server"
import { getDeepSeekKey } from "@/lib/ai-keys"
import { validate, type PlanAnswers } from "@/lib/plan-wizard"

export const dynamic = "force-dynamic"

/**
 * One turn of the planning conversation.
 *
 * The model asks a single question at a time and returns, alongside its reply,
 * everything it has understood so far. The client never accumulates the answers
 * itself — it echoes back what the server last confirmed, so a reload or a
 * mangled reply cannot quietly lose half the request.
 *
 * `quick` are tappable answers. They are what makes this bearable on a phone:
 * most of the conversation should be two taps, not typing.
 */

const FIELDS = `
timing            "exact" | "window" | "months" | "unsure"
                  "exact"  they know the dates
                  "window" they can sail any week inside a span — "any time
                           between 6 and 27 June" — which is the usual answer
                  "months" only the month or months are decided
dateFrom,dateTo   ISO yyyy-mm-dd, only when timing is "exact"
windowFrom,windowTo  ISO yyyy-mm-dd, only when timing is "window": the earliest
                  they could start and the latest they must be back
months            ["2026-06", ...] only when timing is "months"
duration          "week" | "tendays" | "twoweeks" | "longer" | "unsure"
flexible          boolean — could they shift dates for the right boat
adults            number
children          number (0 if none)
childAges         free text, only if there are children
occasion          "family" | "friends" | "couple" | "corporate" | "other"
crewMode          "bareboat" | "skippered" | "crewed" | "advise"
experience        "licensed-experienced" | "licensed-rusty" | "no-licence" | "never-sailed"
boatKind          "monohull" | "catamaran" | "either"
cabins            number, optional
priorities        any of: comfort, recent, easy-handling, space, watertoys, aircon, budget
regions           any of: lefkada, meganisi, ithaca, kefalonia, kalamos-kastos, paxos-antipaxos, corfu, advise
                  These are waters to sail to, not a choice of base.
budgetFrom        number in EUR per week, optional
budgetTo          number in EUR per week, optional
budgetFlexible    boolean
extras            any of: provisioning, transfer, skipper, instructor, hostess,
                  weathersms, sup, outboard, blister, accommodation
                  Ask this as a question with tappable options — list the ones
                  that fit this crew rather than asking an open "anything else?"
firstName         string
lastName          string
email             string
phone             string, optional
contactPreference "email" | "phone" | "whatsapp"
notes             anything else they told you, in their own words
`.trim()

function systemPrompt(locale: string, today: string) {
  const language =
    locale === "el" ? "Greek" : locale === "de" ? "German" : "English"

  return `You are the charter planner for Ionische Yacht Charter (IYC), a German-Greek family business on the pontoon in Lefkada harbour, chartering in the Ionian Sea since 1979. You are talking to someone who wants to plan a sailing holiday.

Today is ${today}. Write in ${language}, warmly and plainly, like a person who knows these islands — never like a form. Address the customer with the polite form where the language has one.

YOUR JOB
Have a short conversation and come away with everything a colleague needs to propose the right boat. Ask about ONE thing per turn. Two related things are fine if they are naturally one question (for example how many adults and how many children). Never present a list of every remaining question.

Acknowledge what they just said in a few words before asking the next thing. Keep each reply under about 45 words.

Start by asking when they would like to sail. Most people answer with a span rather than two exact dates — "the second half of June", "any week between the 6th and the 27th". Take that as it is, record it as a window, and do not push them towards exact dates; a wide window is what lets us find them the right boat.
 Leave the contact details for the very end — ask for the name and email only once everything else is settled, and say why you need them.

WHERE WE SAIL FROM
Every IYC charter starts and finishes on our own pontoon in Lefkada harbour, in Greece. There is no other base and no other country. Never ask which port they would like to leave from, never offer Croatia, Turkey, Spain or anywhere outside the Ionian, and never suggest a one-way charter. Islands and bays are places they sail to during the week, always out of Lefkada and back.

If they say they do not know, or do not mind, accept it and move on — "unsure", "advise" and "either" are real answers. Never ask the same thing twice. Never invent prices, availability, or yachts. If they ask what you would recommend, answer briefly from what you know of the Ionian and carry on.

FIELDS TO FILL
${FIELDS}

Set "done" to true only after you have firstName, email, and enough of the rest to brief a colleague — and in that same reply, thank them and tell them the request is on its way to Maria and Thomas.`
}

/* The output contract goes in its own message, sent last. Buried at the end of
   a long system prompt the model would sometimes ignore it and answer in prose,
   which took the turn down. Immediately before generation it holds. */
function formatPrompt(locale: string) {
  const language = locale === "el" ? "Greek" : locale === "de" ? "German" : "English"
  return `Reply with a JSON object and nothing else. No prose, no code fence.

{"reply": "what you say next, in ${language}", "answers": {...cumulative...}, "quick": ["tappable answer", ...], "done": false}

"answers" repeats every field you already knew plus anything new — it replaces what came before, so never drop a field you have already filled.
"quick" holds 2 to 6 short tappable answers in ${language} for the question you just asked. Fill it for EVERY question that has options — cabins, budget bands, extras, areas, experience, all of them. Leave it empty only when asking for a name, an email address or a telephone number. A turn without quick answers is a turn the customer has to type, so treat an empty array as a last resort.`
}

interface Turn {
  reply?: string
  answers?: Partial<PlanAnswers>
  quick?: unknown
  done?: boolean
}

/**
 * Pull the JSON object out of a reply.
 *
 * DeepSeek's `response_format: json_object` intermittently returns an empty
 * string with `finish_reason: stop` — not truncation, just nothing — which took
 * the whole conversation down with a 502. Asking for JSON in the prompt and
 * parsing tolerantly is steadier: it survives a ```json fence or a sentence
 * either side of the object.
 */
function extractJson(raw: string): Turn {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
  try {
    return JSON.parse(text) as Turn
  } catch {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start === -1 || end <= start) {
      // Carry the prose along so the caller can still show it to the customer.
      const e = new Error("no JSON object in reply") as Error & { prose?: string }
      e.prose = text
      throw e
    }
    return JSON.parse(text.slice(start, end + 1)) as Turn
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, answers, locale } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[]
      answers: Partial<PlanAnswers>
      locale?: string
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 })
    }
    // A runaway conversation is a cost problem, not a feature.
    if (messages.length > 60) {
      return NextResponse.json({ error: "conversation too long" }, { status: 400 })
    }

    const apiKey = await getDeepSeekKey()
    const loc = locale === "el" || locale === "de" ? locale : "en"
    const today = new Date().toISOString().slice(0, 10)

    /* Only the recent turns go to the model. The full state travels in the
       `answers` system message, so trimming the transcript costs nothing and
       keeps the request from growing until the reply gets truncated. */
    const recent = messages.slice(-16)

    const ask = async (nudge?: string) => {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.6,
          // A ceiling, so a long turn cannot run out mid-object.
          max_tokens: 1200,
          messages: [
            { role: "system", content: systemPrompt(loc, today) },
            { role: "system", content: `Answers so far: ${JSON.stringify(answers ?? {})}` },
            ...recent.map((m) => ({ role: m.role, content: m.content })),
            { role: "system" as const, content: formatPrompt(loc) + (nudge ? "\n\n" + nudge : "") },
          ],
        }),
      })
      if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
      const json = await res.json()
      const content = json?.choices?.[0]?.message?.content
      if (typeof content !== "string" || !content.trim()) {
        throw new Error(`empty content (finish_reason=${json?.choices?.[0]?.finish_reason})`)
      }
      return extractJson(content)
    }

    let parsed: Turn
    try {
      parsed = await ask()
    } catch (first) {
      console.warn("[plan/chat] retrying:", (first as Error).message)
      try {
        parsed = await ask("Your last reply was not valid JSON. Return only the object.")
      } catch (second) {
        /* Both attempts failed to produce the object. If the model at least
           said something, use it and carry the answers forward — a planning
           conversation must never dead-end on a formatting slip. */
        console.warn("[plan/chat] degrading:", (second as Error).message)
        parsed = { reply: (second as Error & { prose?: string }).prose ?? "", answers: {}, quick: [], done: false }
        if (!parsed.reply) throw second
      }
    }

    // Merge rather than replace: a turn that drops a field must not lose it.
    const merged: Partial<PlanAnswers> = { ...(answers ?? {}), ...(parsed.answers ?? {}) }

    // The model decides when it is finished; the schema decides whether it is.
    const done = Boolean(parsed.done) && validate(merged) === null

    return NextResponse.json({
      reply: String(parsed.reply ?? "").trim(),
      answers: merged,
      quick: Array.isArray(parsed.quick) ? parsed.quick.map(String).slice(0, 6) : [],
      done,
      missing: done ? null : validate(merged),
    })
  } catch (err) {
    console.error("[plan/chat]", err)
    return NextResponse.json({ error: "chat_failed" }, { status: 502 })
  }
}
