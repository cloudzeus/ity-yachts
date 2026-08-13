import type { Metadata } from "next"
import { Manrope, Inter, Commissioner, IBM_Plex_Mono } from "next/font/google"
import { TranslationProvider } from "@/lib/use-translations"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Parallax } from "@/components/parallax"
import { RevealFailsafe } from "@/components/reveal-failsafe"
import { PlanLauncher } from "@/components/plan/plan-launcher"
import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

// Neither Manrope nor Inter ships Greek glyphs. Commissioner does, and is
// stacked behind both so Greek copy falls back to it instead of a system face.
const commissioner = Commissioner({
  variable: "--font-commissioner",
  subsets: ["latin", "greek"],
  display: "swap",
})

// Specs, prices and coordinates — always tabular. Latin only: Google Fonts
// ships no Greek subset for IBM Plex Mono, and this face only ever sets
// numerals and units.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "IYC Yachts",
  description: "Maritime enterprise management platform",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${commissioner.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <Parallax />
        <RevealFailsafe />
        <TranslationProvider>
          {children}
          {/* Mounted once here, so the conversation survives navigation. */}
          <PlanLauncher />
        </TranslationProvider>
      </body>
    </html>
  )
}
