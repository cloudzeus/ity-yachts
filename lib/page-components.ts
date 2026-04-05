// ── Page Component Registry ──────────────────────────────────
// Defines available component types that can be placed on pages.
// Each type has a key, display name, description, and default props/dataSource.

export interface ComponentDefinition {
  type: string
  label: string
  description: string
  category: "content" | "data" | "media" | "layout"
  defaultProps: Record<string, unknown>
  defaultDataSource: Record<string, unknown>
}

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  "team-grid": {
    type: "team-grid",
    label: "Team Grid",
    description: "Displays company staff members in a responsive grid with photos, names, and positions",
    category: "data",
    defaultProps: {
      columns: 4,
      variant: "minimal",    // "minimal" | "card" | "overlay"
      showBio: false,
      maxMembers: 0,         // 0 = all
    },
    defaultDataSource: {
      model: "staff",
      filter: { status: "active" },
      orderBy: { sortOrder: "asc" },
    },
  },
  "skipper-academy": {
    type: "skipper-academy",
    label: "Skipper Academy Content",
    description: "All editable content for the Skipper Academy page — sections, features, curriculum, testimonials, stats",
    category: "content",
    defaultProps: {
      valueProposition: {
        headline: { en: "Why Choose IYC Skipper Academy?", el: "", de: "" },
        subtext: { en: "Successful Skippering: Safety, Practice & Real Experience", el: "", de: "" },
        body: { en: "Participants receive both theoretical knowledge and hands-on practical experience to independently conduct sailing tours or refresh maritime skills. Our training covers safety protocols, seamanship techniques, navigation, and crew management in a supportive, pressure-free learning environment. Whether you're preparing for a boat license, refreshing your skills, or building confidence as a skipper, we provide the foundation you need.", el: "", de: "" },
      },
      features: [
        { icon: "Compass", title: { en: "Expert Instruction", el: "", de: "" }, description: { en: "Learn from experienced skippers with decades of sailing experience and thousands of nautical miles sailed, primarily in the Mediterranean.", el: "", de: "" } },
        { icon: "Sailboat", title: { en: "Practical, Hands-On Learning", el: "", de: "" }, description: { en: "Emphasis on real sailing experience over theory: boat handling, sail management, navigation, and decision-making in actual conditions.", el: "", de: "" } },
        { icon: "Shield", title: { en: "Safe & Personalized", el: "", de: "" }, description: { en: "Pressure-free learning environment adapted to each crew member's skill level and participation comfort.", el: "", de: "" } },
        { icon: "MapPin", title: { en: "Ionian Sailing", el: "", de: "" }, description: { en: "Train in Greece's stunning Ionian Islands—Lefkas, Kefallonia, Ithaka, Meganisi, Kalamos—where stable spring weather and beautiful scenery enhance learning.", el: "", de: "" } },
        { icon: "Award", title: { en: "Certified Knowledge", el: "", de: "" }, description: { en: "Receive sea mile certifications and planning documents for future sailing adventures.", el: "", de: "" } },
        { icon: "BookOpen", title: { en: "Ideal Foundation", el: "", de: "" }, description: { en: "Perfect prep for boat license exams or refresher for experienced sailors wanting to regain confidence.", el: "", de: "" } },
      ],
      trainingProgram: {
        headline: { en: "Comprehensive Skipper Training in the Ionian Sea", el: "", de: "" },
        body: { en: "Our week-long training program combines classroom instruction with real-world sailing practice. You'll work with a small crew aboard well-equipped sailing yachts (4–5 cabins) in Greece's stunning Ionian Islands. Training typically runs April–May when weather is stable and direct flights are available from major German cities.", el: "", de: "" },
        curriculum: [
          { en: "Boat Systems & Safety Protocols", el: "", de: "" },
          { en: "Motor & Sail Handling", el: "", de: "" },
          { en: "Navigation & Route Planning", el: "", de: "" },
          { en: "Mooring & Anchoring", el: "", de: "" },
          { en: "Emergency & Rescue Procedures", el: "", de: "" },
          { en: "Weather Assessment", el: "", de: "" },
          { en: "Crew Management & Leadership", el: "", de: "" },
          { en: "Essential Seamanship", el: "", de: "" },
        ],
        audience: [
          { en: "Anyone refreshing their seamanship skills", el: "", de: "" },
          { en: "Future boat license holders seeking preparation", el: "", de: "" },
          { en: "Experienced sailors wanting to rebuild confidence", el: "", de: "" },
          { en: "Anyone ready to command their own sailing adventure", el: "", de: "" },
        ],
      },
      testimonials: [
        { name: "Maria", location: { en: "Germany", el: "", de: "" }, content: { en: "I came as a complete beginner and left with real confidence at the helm. The instructors made everything accessible without dumbing it down.", el: "", de: "" }, rating: 5 },
        { name: "Hans", location: { en: "Switzerland", el: "", de: "" }, content: { en: "The balance of theory and practice was perfect. I actually felt comfortable taking the helm in real conditions.", el: "", de: "" }, rating: 5 },
        { name: "Sarah", location: { en: "UK", el: "", de: "" }, content: { en: "Beyond just sailing skills, the experience in Greece was unforgettable. I'd go back just for that—the learning is a bonus!", el: "", de: "" }, rating: 5 },
      ],
      stats: [
        { value: { en: "1 Week", el: "", de: "" }, label: { en: "Duration", el: "", de: "" } },
        { value: { en: "April–May", el: "", de: "" }, label: { en: "When", el: "", de: "" } },
        { value: { en: "€800–€1,050", el: "", de: "" }, label: { en: "Price / Person", el: "", de: "" } },
        { value: { en: "Certified", el: "", de: "" }, label: { en: "Outcome", el: "", de: "" } },
      ],
      cta: {
        headline: { en: "Ready to Gain Confidence at the Helm?", el: "", de: "" },
        body: { en: "Join our next training program in the Ionian Islands. Limited spots available for 2026.", el: "", de: "" },
        primaryButton: { en: "View 2026 Training Dates", el: "", de: "" },
        primaryLink: "/contact",
        secondaryButton: { en: "Get in Touch", el: "", de: "" },
        secondaryLink: "/contact",
      },
      blessing: {
        quote: { en: "Mast und Schotbruch!", el: "", de: "" },
        subtitle: { en: "Wishing you prosperous winds and safe passages", el: "", de: "" },
      },
    },
    defaultDataSource: {},
  },
}

export function getComponentDefinition(type: string): ComponentDefinition | null {
  return COMPONENT_REGISTRY[type] ?? null
}

export function getComponentTypes(): ComponentDefinition[] {
  return Object.values(COMPONENT_REGISTRY)
}
