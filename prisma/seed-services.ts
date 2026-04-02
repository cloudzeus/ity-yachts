import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const services = [
  {
    title: { en: "Custom Routes", el: "", de: "" },
    slug: "custom-routes",
    status: "published",
    label: { en: "Tailored Journeys", el: "", de: "" },
    header: { en: "Custom Routes", el: "", de: "" },
    shortDesc: {
      en: "Tailor-made itineraries crafted exclusively to your preferences. Navigate from secluded, untouched coves to vibrant, historic harbours across the Mediterranean.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "map",
    link: null,
    showOnHomepage: true,
    sortOrder: 0,
  },
  {
    title: { en: "24/7 Concierge", el: "", de: "" },
    slug: "concierge",
    status: "published",
    label: { en: "Always Available", el: "", de: "" },
    header: { en: "24/7 Concierge", el: "", de: "" },
    shortDesc: {
      en: "Dedicated support before, during, and after your charter. We anticipate your needs and handle every detail flawlessly.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "bell",
    link: null,
    showOnHomepage: true,
    sortOrder: 1,
  },
  {
    title: { en: "Gourmet Catering", el: "", de: "" },
    slug: "gourmet-catering",
    status: "published",
    label: { en: "Culinary Excellence", el: "", de: "" },
    header: { en: "Gourmet Catering", el: "", de: "" },
    shortDesc: {
      en: "Private chefs and curated dining experiences featuring the finest, locally-sourced Mediterranean cuisine.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "utensils",
    link: null,
    showOnHomepage: true,
    sortOrder: 2,
  },
  {
    title: { en: "Safety First", el: "", de: "" },
    slug: "safety-first",
    status: "published",
    label: { en: "Peace of Mind", el: "", de: "" },
    header: { en: "Safety First", el: "", de: "" },
    shortDesc: {
      en: "Fully insured vessels, highly certified crew, and rigorous safety protocols implemented on every single voyage.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "shield",
    link: null,
    showOnHomepage: true,
    sortOrder: 3,
  },
  {
    title: { en: "Luxury Amenities", el: "", de: "" },
    slug: "luxury-amenities",
    status: "published",
    label: { en: "Premium Comfort", el: "", de: "" },
    header: { en: "Luxury Amenities", el: "", de: "" },
    shortDesc: {
      en: "State-of-the-art water toys, rejuvenating spa treatments, and premium entertainment systems aboard every yacht.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "star",
    link: null,
    showOnHomepage: true,
    sortOrder: 4,
  },
  {
    title: { en: "Flexible Booking", el: "", de: "" },
    slug: "flexible-booking",
    status: "published",
    label: { en: "On Your Terms", el: "", de: "" },
    header: { en: "Flexible Booking", el: "", de: "" },
    shortDesc: {
      en: "Bareboat or crewed, day charter or week-long — book on your terms with easy modifications and transparent policies.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "calendar",
    link: null,
    showOnHomepage: true,
    sortOrder: 5,
  },
  {
    title: { en: "Skippers School", el: "", de: "" },
    slug: "skippers-school",
    status: "published",
    label: { en: "Master The Seas", el: "", de: "" },
    header: { en: "Skippers School", el: "", de: "" },
    shortDesc: {
      en: "Learn to captain your own vessel with our professional training programs. Attain comprehensive certification courses guided by seasoned maritime experts.",
      el: "",
      de: "",
    },
    description: { en: "", el: "", de: "" },
    defaultMedia: null,
    defaultMediaType: null,
    icon: "compass",
    link: null,
    showOnHomepage: true,
    sortOrder: 6,
  },
]

async function main() {
  console.log("Seeding services...")

  for (const svc of services) {
    const existing = await db.service.findUnique({ where: { slug: svc.slug } })
    if (existing) {
      console.log(`  Skipping "${svc.title.en}" — already exists`)
      continue
    }
    await db.service.create({ data: svc })
    console.log(`  Created "${svc.title.en}"`)
  }

  console.log("Done!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
