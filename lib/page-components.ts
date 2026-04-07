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
  "contact-content": {
    type: "contact-content",
    label: "Contact Page Content",
    description: "Manages all editable content for the Contact page — hero, stats, offices, family badge, CTA",
    category: "content",
    defaultProps: {
      hero: {
        badge: { en: "Get In Touch", el: "Επικοινωνία", de: "Kontakt" },
        title: { en: "Let's Plan Your", el: "Ας Σχεδιάσουμε", de: "Planen Wir Ihre" },
        titleAccent: { en: "Perfect Charter", el: "Τέλειο Charter", de: "Perfekte Charter" },
        subtitle: {
          en: "Whether you have a question, want to book a yacht, or just want to say hello — our family team is here for you since 1979.",
          el: "",
          de: "",
        },
      },
      stats: [
        { num: "45+", label: { en: "Years of Experience", el: "Χρόνια Εμπειρίας", de: "Jahre Erfahrung" } },
        { num: "2", label: { en: "Offices Worldwide", el: "Γραφεία", de: "Büros weltweit" } },
        { num: "24h", label: { en: "Response Time", el: "Χρόνος Απόκρισης", de: "Antwortzeit" } },
      ],
      offices: [
        {
          id: "germany",
          label: "Munich Office",
          flag: "🇩🇪",
          person: "Thomas Ramisch",
          address: "Mozartstr. 8, D-80336 München",
          country: "Germany",
          phone: "+49 160 99279870",
          mobile: "",
          email: "info@iyc.de",
          hours: "Mon – Fri: 09:00 – 18:00 CET",
          mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2662.5!2d11.5596!3d48.1351!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDA4JzA2LjQiTiAxMcKwMzMnMzQuNiJF!5e0!3m2!1sen!2sde!4v1",
        },
        {
          id: "greece",
          label: "Lefkada Base",
          flag: "🇬🇷",
          person: "Maria Ramisch",
          address: "PF Panagou 22, GR-31100 Lefkada",
          country: "Greece",
          phone: "+30 26450 26393",
          mobile: "+30 6932 637171",
          email: "maria@iyc.de",
          hours: "Mon – Sat: 08:00 – 20:00 EEST (Season)",
          mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12500!2d20.7069!3d38.8337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDUwJzAxLjMiTiAyMMKwNDInMjQuOCJF!5e0!3m2!1sen!2sgr!4v1",
        },
      ],
      familyBadge: {
        title: { en: "Family Business Since 1979", el: "Οικογενειακή Επιχείρηση από το 1979", de: "Familienunternehmen seit 1979" },
        description: {
          en: "German-Greek family operation with deep roots in the Ionian Sea. Personal service, not a call center.",
          el: "",
          de: "",
        },
      },
      cta: {
        title: { en: "Ready to Set Sail?", el: "Έτοιμοι για Αναχώρηση;", de: "Bereit zum Absegeln?" },
        description: {
          en: "Browse our fleet and find the perfect yacht for your Ionian adventure.",
          el: "",
          de: "",
        },
        primaryBtn: { en: "Explore Fleet", el: "Δείτε τον Στόλο", de: "Flotte erkunden" },
        primaryLink: "/fleet",
        secondaryBtn: { en: "View Destinations", el: "Προορισμοί", de: "Ziele ansehen" },
        secondaryLink: "/locations",
      },
    },
    defaultDataSource: {},
  },

  "fleet-content": {
    type: "fleet-content",
    label: "Fleet Page Header",
    description: "Manages the hero header content for the Fleet listing page",
    category: "content",
    defaultProps: {
      hero: {
        badge: { en: "Browse Our Fleet", el: "Ο Στόλος Μας", de: "Unsere Flotte" },
        title: { en: "Find Your Perfect Yacht", el: "Βρείτε το Ιδανικό Σας Σκάφος", de: "Finden Sie Ihre perfekte Yacht" },
        subtitle: {
          en: "Browse our full fleet of yachts and catamarans available for charter in the Ionian Sea.",
          el: "",
          de: "",
        },
      },
    },
    defaultDataSource: {},
  },

  "locations-content": {
    type: "locations-content",
    label: "Locations Page Header",
    description: "Manages the hero header content for the Destinations listing page",
    category: "content",
    defaultProps: {
      hero: {
        badge: { en: "Charter Destinations", el: "Προορισμοί Charter", de: "Charter-Ziele" },
        title: { en: "Discover the Ionian Sea", el: "Ανακαλύψτε το Ιόνιο Πέλαγος", de: "Entdecken Sie das Ionische Meer" },
        subtitle: {
          en: "Explore Lefkada and the Ionian islands — from secluded turquoise bays to vibrant seaside harbours.",
          el: "",
          de: "",
        },
      },
    },
    defaultDataSource: {},
  },

  "itineraries-content": {
    type: "itineraries-content",
    label: "Itineraries Page Header",
    description: "Manages the hero header content for the Sailing Itineraries listing page",
    category: "content",
    defaultProps: {
      hero: {
        badge: { en: "Explore Routes", el: "Διαδρομές", de: "Routen erkunden" },
        title: { en: "Sailing Itineraries", el: "Ιστιοπλοϊκές Διαδρομές", de: "Segelrouten" },
        subtitle: {
          en: "Discover hand-crafted sailing routes through the most beautiful destinations in Greece.",
          el: "",
          de: "",
        },
      },
    },
    defaultDataSource: {},
  },

  "news-content": {
    type: "news-content",
    label: "News Page Header",
    description: "Manages the hero header content for the News & Articles listing page",
    category: "content",
    defaultProps: {
      hero: {
        badge: { en: "Our Blog", el: "Το Blog Μας", de: "Unser Blog" },
        title: { en: "News & Articles", el: "Νέα & Άρθρα", de: "News & Artikel" },
        subtitle: {
          en: "Sailing tips, destination guides, and stories from the Ionian Sea.",
          el: "",
          de: "",
        },
      },
    },
    defaultDataSource: {},
  },

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
  "services-content": {
    type: "services-content",
    label: "Services Page Content",
    description: "Manages all editable content for the Services listing page — hero, title accent, subtitle, and CTA band",
    category: "content",
    defaultProps: {
      hero: {
        badge: { en: "Our Services", el: "Υπηρεσίες Μας", de: "Unsere Leistungen" },
        title: { en: "Premium Charter", el: "Premium Charter", de: "Premium Charter" },
        titleAccent: { en: "Services", el: "Υπηρεσίες", de: "Leistungen" },
        subtitle: {
          en: "Everything you need for an unforgettable voyage — from bareboat to fully crewed luxury, tailored to your journey.",
          el: "",
          de: "",
        },
      },
      cta: {
        title: { en: "Plan Your Perfect Charter", el: "Σχεδιάστε το Ιδανικό σας Charter", de: "Planen Sie Ihre perfekte Charter" },
        description: {
          en: "Browse our fleet and connect with our team to craft your ideal sailing experience.",
          el: "",
          de: "",
        },
        primaryBtn: { en: "Browse Our Fleet", el: "Δείτε τον Στόλο", de: "Flotte erkunden" },
        primaryLink: "/fleet",
        secondaryBtn: { en: "Contact Us", el: "Επικοινωνήστε", de: "Kontakt" },
        secondaryLink: "/contact",
      },
    },
    defaultDataSource: {},
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
