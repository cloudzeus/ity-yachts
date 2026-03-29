import type { Metadata } from "next"
import { Manrope, Inter } from "next/font/google"
import { TranslationProvider } from "@/lib/use-translations"
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

export const metadata: Metadata = {
  title: "IYC Yachts",
  description: "Maritime enterprise management platform",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TranslationProvider>{children}</TranslationProvider>
      </body>
    </html>
  )
}
