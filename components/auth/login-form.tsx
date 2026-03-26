"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loginAction } from "@/app/actions/auth"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const [email, setEmail] = useState("gkozyris@i4ria.com")
  const [password, setPassword] = useState("1f1femsk")
  const [loading, setLoading] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setClientError(null)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const result = await loginAction(formData)

      if (result.error) {
        setClientError(result.error)
      } else if (result.success) {
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      console.error("Error:", err)
      setClientError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-1"
        style={{ background: "var(--gradient-ocean)" }}
      />

      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center"
            style={{
              background: "var(--gradient-ocean)",
              borderRadius: "var(--radius-xs)",
            }}
          >
            <span
              className="text-xs font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--tertiary-fixed)" }}
            >
              IYC
            </span>
          </div>
          <div className="text-center">
            <h1
              className="text-lg font-bold leading-none"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--primary)",
                letterSpacing: "-0.02em",
              }}
            >
              IYC Yachts
            </h1>
            <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Maritime Enterprise Platform
            </p>
          </div>
        </div>

        <div
          className="p-8"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <h2
            className="mb-1 text-[1.125rem] font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Sign in
          </h2>
          <p className="mb-6 text-xs" style={{ color: "var(--on-surface-variant)" }}>
            Access your admin panel
          </p>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="label-sm" style={{ color: "var(--on-surface-variant)" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="gkozyris@i4ria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-transparent pb-2 text-sm outline-none transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--on-surface)",
                  borderBottom: "2px solid rgba(196,198,207,0.3)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = "var(--secondary-light)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = "rgba(196,198,207,0.3)"
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="label-sm" style={{ color: "var(--on-surface-variant)" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-transparent pb-2 text-sm outline-none transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--on-surface)",
                  borderBottom: "2px solid rgba(196,198,207,0.3)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = "var(--secondary-light)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = "rgba(196,198,207,0.3)"
                }}
              />
            </div>

            {(error || clientError) && (
              <div
                className="px-3 py-2 text-sm"
                style={{
                  background: "var(--error-container)",
                  color: "var(--error)",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                {error || clientError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-1 w-full py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{
                background: loading ? "var(--primary-container)" : "var(--gradient-ocean)",
                borderRadius: "var(--radius-xs)",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
