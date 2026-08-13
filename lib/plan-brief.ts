import "server-only"
import { db } from "@/lib/db"
import { getDeepSeekKey } from "@/lib/ai-keys"
import { crewSize, type PlanAnswers } from "@/lib/plan-wizard"

/**
 * A brief written from the wizard answers, for whoever picks up the enquiry.
 *
 * The model is given the real fleet, so a shortlist names boats that exist and
 * can actually take the crew. It is never allowed to block the enquiry: if the
 * call fails the request is still saved and sent, with a brief assembled from
 * the answers instead.
 */
export interface PlanBrief {
  summary: string
  shortlist: { yacht: string; why: string }[]
  suggests: string[]
  asks: string[]
  generated: boolean
}

interface FleetRow {
  name: string
  category: string
  cabins: number
  berths: number
  loa: number
  priceFrom: number | null
}

async function loadFleet(): Promise<FleetRow[]> {
  const yachts = await db.nausysYacht.findMany({
    select: {
      name: true, cabins: true, berthsTotal: true, maxPersons: true, loa: true,
      category: { select: { name: true } },
      prices: { where: { priceType: "WEEKLY" }, orderBy: { price: "asc" }, take: 1, select: { price: true } },
    },
    orderBy: { loa: "asc" },
  })

  return yachts.map((y) => ({
    name: y.name ?? "",
    category: ((y.category?.name as Record<string, string> | null)?.en) ?? "",
    cabins: y.cabins ?? 0,
    berths: y.berthsTotal || y.maxPersons || 0,
    loa: Number(y.loa ?? 0),
    priceFrom: y.prices[0] ? Number(y.prices[0].price) : null,
  }))
}

/** What the team can act on without the model — used whenever the call fails. */
function fallbackBrief(a: PlanAnswers, fleet: FleetRow[]): PlanBrief {
  const people = crewSize(a)
  const fits = fleet.filter((y) => y.berths >= people)
  return {
    summary:
      `${a.firstName} ${a.lastName}`.trim() +
      ` — ${people} aboard (${a.adults} adults` +
      (a.children ? `, ${a.children} children` : "") +
      `), ${a.duration}, ${a.crewMode}. ` +
      (a.timing === "exact"
        ? `Dates ${a.dateFrom} to ${a.dateTo}.`
        : a.timing === "months"
        ? `Looking at ${a.months.join(", ")}.`
        : "Dates still open."),
    shortlist: fits.slice(0, 3).map((y) => ({
      yacht: y.name,
      why: `${y.berths} berths, ${y.cabins} cabins, ${y.loa.toFixed(2)} m`,
    })),
    suggests: [],
    asks: [],
    generated: false,
  }
}

export async function buildPlanBrief(a: PlanAnswers): Promise<PlanBrief> {
  const fleet = await loadFleet()

  try {
    const apiKey = await getDeepSeekKey()
    const people = crewSize(a)

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a charter broker at Ionische Yacht Charter, a German-Greek family business based in Lefkada since 1979, chartering in the Ionian Sea. " +
              "You are writing an internal brief for the colleague who will answer this enquiry — not a message to the customer. " +
              "Be concrete and short. Never invent a yacht: recommend only from the fleet list given to you, and only boats whose berths cover the whole crew. " +
              "Never invent prices, availability or dates. If something important is missing from the answers, put it in `asks`. " +
              'Reply as JSON: {"summary": string, "shortlist": [{"yacht": string, "why": string}], "suggests": [string], "asks": [string]}. ' +
              "`summary` is two or three sentences on who this crew is and what would suit them. " +
              "`shortlist` is at most three boats from the fleet, each with one line on why it fits this particular crew. " +
              "`suggests` is up to three practical ideas for the itinerary or the timing, grounded in the Ionian. " +
              "`asks` is what to confirm on the first reply. Write in English.",
          },
          {
            role: "user",
            content: JSON.stringify({
              crew: {
                adults: a.adults,
                children: a.children,
                childAges: a.childAges || null,
                total: people,
                occasion: a.occasion,
              },
              when: {
                timing: a.timing,
                dateFrom: a.dateFrom || null,
                dateTo: a.dateTo || null,
                months: a.months,
                duration: a.duration,
                flexible: a.flexible,
              },
              sailing: { crewMode: a.crewMode, experience: a.experience },
              boat: { kind: a.boatKind, cabinsWanted: a.cabins || null, priorities: a.priorities },
              regions: a.regions,
              budget: { from: a.budgetFrom || null, to: a.budgetTo || null, flexible: a.budgetFlexible },
              extras: a.extras,
              customerNotes: a.notes || null,
              fleet,
            }),
          },
        ],
        temperature: 0.4,
      }),
    })

    if (!res.ok) throw new Error(`DeepSeek ${res.status}`)

    const json = await res.json()
    const parsed = JSON.parse(json.choices[0].message.content) as Partial<PlanBrief>

    // The model is asked for a shape; trust nothing about what comes back.
    const known = new Set(fleet.map((y) => y.name))
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      shortlist: Array.isArray(parsed.shortlist)
        ? parsed.shortlist
            .filter((s) => s && typeof s.yacht === "string" && known.has(s.yacht))
            .slice(0, 3)
            .map((s) => ({ yacht: s.yacht, why: String(s.why ?? "") }))
        : [],
      suggests: Array.isArray(parsed.suggests) ? parsed.suggests.map(String).slice(0, 3) : [],
      asks: Array.isArray(parsed.asks) ? parsed.asks.map(String).slice(0, 5) : [],
      generated: true,
    }
  } catch {
    return fallbackBrief(a, fleet)
  }
}
