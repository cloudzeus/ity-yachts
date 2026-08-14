import { NextRequest, NextResponse } from "next/server"
import { aiChat } from "@/lib/ai"
import { bookableMonths, normalisePlanDates, todayIso } from "@/lib/plan-dates"
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

function systemPrompt(locale: string, today: string, bookable: string[]) {
  const language =
    locale === "el" ? "Greek" : locale === "de" ? "German" : "English"

  return `You are the charter planner for Ionische Yacht Charter (IYC), a German-Greek family business on the pontoon in Lefkada harbour, chartering in the Ionian Sea since 1979. You are talking to someone who wants to plan a sailing holiday.

Today is ${today}. Write in ${language}, warmly and plainly, like a person who knows these islands — never like a form. Address the customer with the polite form where the language has one.

YOUR JOB
Have a short conversation and come away with everything a colleague needs to propose the right boat. Ask about ONE thing per turn. Two related things are fine if they are naturally one question (for example how many adults and how many children). Never present a list of every remaining question.

Acknowledge what they just said in a few words before asking the next thing. Keep each reply under about 45 words.

WHEN THEY CAN SAIL
The season runs May to October. Today is ${today}, so the months still open are ${bookable.join(", ")} — in that order, nearest first. Never offer, suggest or record a date that has already gone. If they name a month or a period that has passed this year they mean next year, so record next year's. Your tappable answers for that question must come from those months, written the way a person says them — "this September", "May next year" — never as a code and never with the yyyy-mm in brackets. The codes are for the answers object only.

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
/** Shown when no provider answers, so the visitor is not left with a blank. */
const OUTAGE_REPLY: Record<string, string> = {
  en: "Sorry — I cannot reach the planner just now. Please try again in a moment, or write to bookings@iyc.de and a person will pick it up.",
  el: "Συγγνώμη — δεν μπορώ να συνδεθώ με τον βοηθό αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο ή γράψτε μας στο bookings@iyc.de και θα σας απαντήσει άνθρωπος.",
  de: "Entschuldigung — der Planer ist gerade nicht erreichbar. Bitte versuchen Sie es gleich noch einmal, oder schreiben Sie an bookings@iyc.de; dann meldet sich jemand persönlich.",
}

function formatPrompt(locale: string) {
  const language = locale === "el" ? "Greek" : locale === "de" ? "German" : "English"
  return `Reply with a JSON object and nothing else. No prose, no code fence.

{"reply": "what you say next, in ${language}", "answers": {...cumulative...}, "quick": ["tappable answer", ...], "done": false}

"answers" holds ONLY what this turn established or changed. Never repeat a field that was already known and is unchanged — the server keeps them. Most turns should carry one or two fields, and a turn that established nothing carries an empty object.
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

    const loc = locale === "el" || locale === "de" ? locale : "en"
    const today = todayIso()
    const bookable = bookableMonths(today)

    /* Only the recent turns go to the model. The full state travels in the
       `answers` system message, so trimming the transcript costs nothing and
       keeps the request from growing until the reply gets truncated. */
    const recent = messages.slice(-16)

    const ask = async (nudge?: string) => {
      const content = await aiChat({
        /* The reply is parsed as an object, so ask the API for one. Without
           this the model intermittently returned empty content. */
        json: true,
        temperature: 0.6,
        // A ceiling, so a long turn cannot run out mid-object.
        maxTokens: 1200,
        messages: [
          { role: "system", content: systemPrompt(loc, today, bookable) },
          { role: "system", content: `Answers so far: ${JSON.stringify(answers ?? {})}` },
          ...recent.map((m) => ({ role: m.role, content: m.content })),
          { role: "system" as const, content: formatPrompt(loc) + (nudge ? "\n\n" + nudge : "") },
        ],
      })
      const turn = extractJson(content)
      /* A well-formed but empty object is a failure too. It parses, so nothing
         downstream complained — the visitor simply got a blank turn. Throwing
         puts it through the same retry as unparseable output. */
      if (!String(turn.reply ?? "").trim()) throw new Error("reply was empty")
      return turn
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
        /* Nothing usable at all — both providers down, or out of credit. The
           conversation used to end here on a 502, which the visitor sees as a
           blank turn and reads as the site being broken. Say what happened and
           give them a way through instead. */
        if (!parsed.reply) {
          console.error("[plan/chat] no provider answered:", (second as Error).message)
          parsed = { reply: OUTAGE_REPLY[loc], answers: {}, quick: [], done: false }
        }
      }
    }

    // Merge rather than replace: a turn that drops a field must not lose it.
    /* A delta, merged over what we already hold. Null and undefined are
       dropped first: with the model no longer repeating the whole object, an
       explicit null would erase a field it only meant to leave alone, and the
       old prompt's repetition is no longer there to put it back next turn. */
    const delta = Object.fromEntries(
      Object.entries(parsed.answers ?? {}).filter(([, v]) => v !== null && v !== undefined)
    ) as Partial<PlanAnswers>
    const raw: Partial<PlanAnswers> = { ...(answers ?? {}), ...delta }

    /* Being told today's date does not stop the model resolving "first half of
       July" to a July that has gone. Anything in the past is moved to the next
       time it comes round, in pairs so a window cannot end before it starts. */
    const merged = normalisePlanDates(raw, today)

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
