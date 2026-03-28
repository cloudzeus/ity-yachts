"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Info, X, MapPin, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────

type CustomerData = {
  id: string
  userId: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  mobile: string
  nationality: string
  passportNumber: string
  passportExpiry: string | null
  dateOfBirth: string | null
  address: string
  city: string
  country: string
  postcode: string
  sailingExperience: string
  certifications: string[]
  emergencyName: string
  emergencyPhone: string
  notes: string | null
  _count: { bookings: number }
  createdAt: string
  updatedAt: string
}

interface Props {
  customer: CustomerData
}

// ─── Countries & Nationalities ──────────────────────────────

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Bermuda", "Bolivia", "Bosnia and Herzegovina",
  "Brazil", "Brunei", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile", "China",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia",
  "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala",
  "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kuwait", "Latvia", "Lebanon", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Malaysia", "Maldives", "Malta", "Mexico", "Moldova", "Monaco", "Montenegro",
  "Morocco", "Mozambique", "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nigeria",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Panama", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Tunisia", "Turkey",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Venezuela", "Vietnam",
]

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine",
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini",
  "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Bermudian",
  "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Cambodian",
  "Cameroonian", "Canadian", "Chilean", "Chinese", "Colombian", "Costa Rican",
  "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Dominican", "Ecuadorian",
  "Egyptian", "Estonian", "Ethiopian", "Filipino", "Finnish", "French", "Georgian",
  "German", "Ghanaian", "Greek", "Guatemalan", "Honduran", "Hungarian", "Icelandic",
  "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Jamaican",
  "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kuwaiti", "Latvian", "Lebanese",
  "Libyan", "Lithuanian", "Luxembourgish", "Malaysian", "Maldivian", "Maltese",
  "Mexican", "Moldovan", "Monégasque", "Montenegrin", "Moroccan", "Mozambican",
  "Nepalese", "Dutch", "New Zealander", "Nigerian", "North Macedonian", "Norwegian",
  "Omani", "Pakistani", "Panamanian", "Paraguayan", "Peruvian", "Polish", "Portuguese",
  "Qatari", "Romanian", "Russian", "Saudi", "Serbian", "Singaporean", "Slovak",
  "Slovenian", "South African", "South Korean", "Spanish", "Sri Lankan", "Swedish",
  "Swiss", "Taiwanese", "Thai", "Tunisian", "Turkish", "Ukrainian", "Emirati",
  "Uruguayan", "Venezuelan", "Vietnamese",
]

const CERTIFICATIONS = [
  "ICC",
  "Day Skipper",
  "Coastal Skipper",
  "Yachtmaster Offshore",
  "Yachtmaster Ocean",
  "RYA Competent Crew",
  "Bareboat License",
]

// ─── Combobox Component ─────────────────────────────────────

function Combobox({ value, onChange, options, placeholder, label }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch("") }}
        className="flex items-center justify-between w-full h-8 px-2 text-xs rounded-md border"
        style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
      >
        <span style={{ color: value ? "var(--on-surface)" : "var(--on-surface-variant)", opacity: value ? 1 : 0.6 }}>
          {value || placeholder || "Select..."}
        </span>
        <ChevronDown className="size-3.5 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border shadow-lg flex flex-col"
          style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)", maxHeight: 240 }}
        >
          <div className="p-1.5 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label || ""}...`}
              className="h-7 text-xs"
              style={{ background: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 192 }}>
            {value && (
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 transition-colors italic"
                style={{ color: "var(--on-surface-variant)" }}
                onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>No results</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 transition-colors flex items-center justify-between"
                  style={{ color: "var(--on-surface)" }}
                  onClick={() => { onChange(opt); setOpen(false); setSearch("") }}
                >
                  {opt}
                  {opt === value && <Check className="size-3" style={{ color: "var(--primary)" }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="p-4" style={{ background: "var(--surface-container-lowest)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-ambient)" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function FieldWithInfo({ label, tooltip, children }: { label: string; tooltip: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-3 cursor-help" style={{ color: "var(--on-surface-variant)", opacity: 0.5 }} />
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs max-w-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--on-surface-variant)" }}>{label}</Label>
      {children}
    </div>
  )
}

const inputStyle = { background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }

// ─── Editor ──────────────────────────────────────────────────

export function CustomerEditorClient({ customer }: Props) {
  const router = useRouter()

  // Form state
  const [firstName, setFirstName] = useState(customer.firstName)
  const [lastName, setLastName] = useState(customer.lastName)
  const [email, setEmail] = useState(customer.email)
  const [phone, setPhone] = useState(customer.phone)
  const [mobile, setMobile] = useState(customer.mobile)
  const [dateOfBirth, setDateOfBirth] = useState(customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : "")
  const [nationality, setNationality] = useState(customer.nationality)
  const [country, setCountry] = useState(customer.country)
  const [city, setCity] = useState(customer.city)
  const [address, setAddress] = useState(customer.address)
  const [postcode, setPostcode] = useState(customer.postcode)

  const [sailingExperience, setSailingExperience] = useState(customer.sailingExperience || "NONE")
  const [certifications, setCertifications] = useState<string[]>(customer.certifications ?? [])

  const [passportNumber, setPassportNumber] = useState(customer.passportNumber)
  const [passportExpiry, setPassportExpiry] = useState(customer.passportExpiry ? customer.passportExpiry.slice(0, 10) : "")

  const [emergencyName, setEmergencyName] = useState(customer.emergencyName)
  const [emergencyPhone, setEmergencyPhone] = useState(customer.emergencyPhone)

  const [notes, setNotes] = useState(customer.notes ?? "")

  // Address geocoding
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display: string; lat: number; lon: number }>>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const addressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build form state object for auto-save
  const formState = {
    firstName, lastName, email, phone, mobile,
    dateOfBirth: dateOfBirth || null,
    nationality, country, city, address, postcode,
    sailingExperience, certifications,
    passportNumber,
    passportExpiry: passportExpiry || null,
    emergencyName, emergencyPhone,
    notes: notes || null,
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formState }),
      })
      if (res.ok) {
        setLastSaved(new Date())
      }
    } finally {
      setSaving(false)
    }
  }, [formState, customer.id])

  // Auto-save with debounce
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      save()
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    firstName, lastName, email, phone, mobile, dateOfBirth, nationality,
    country, city, address, postcode, sailingExperience, certifications,
    passportNumber, passportExpiry, emergencyName, emergencyPhone, notes,
  ])

  function toggleCertification(cert: string) {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    )
  }

  // ─── Address geocoding ──────────────────────────────────────

  function handleAddressChange(val: string) {
    setAddress(val)
    if (addressTimeout.current) clearTimeout(addressTimeout.current)
    if (val.length < 3) {
      setAddressSuggestions([])
      return
    }
    addressTimeout.current = setTimeout(async () => {
      setAddressLoading(true)
      try {
        const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(val)}&limit=5`)
        if (res.ok) {
          const json = await res.json()
          setAddressSuggestions(
            (json.suggestions ?? []).map((s: { displayName: string; latitude: number; longitude: number }) => ({
              display: s.displayName,
              lat: s.latitude,
              lon: s.longitude,
            }))
          )
        }
      } finally {
        setAddressLoading(false)
      }
    }, 400)
  }

  function selectAddress(suggestion: { display: string; lat: number; lon: number }) {
    const parts = suggestion.display.split(",").map((p) => p.trim())
    setAddress(suggestion.display)

    // Try to extract city and country from display name
    // Typical format: "Street, City, Region, Country"
    if (parts.length >= 2) {
      // City is usually the second part
      const possibleCity = parts.length >= 3 ? parts[parts.length - 3] : parts[0]
      setCity(possibleCity)
    }
    if (parts.length >= 1) {
      const possibleCountry = parts[parts.length - 1]
      // Only set if it matches a known country
      const matchedCountry = COUNTRIES.find(
        (c) => c.toLowerCase() === possibleCountry.toLowerCase()
      )
      if (matchedCountry) setCountry(matchedCountry)
    }

    setAddressSuggestions([])
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")} className="h-8 gap-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}>
              {firstName} {lastName}
            </h1>
            {lastSaved && (
              <p className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                Last saved {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1.5 text-xs" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} Save
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content - 2/3 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* Personal Information */}
            <SectionCard title="Personal Information">
              <div className="grid grid-cols-2 gap-3">
                <FieldLabel label="First Name *">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
                <FieldLabel label="Last Name *">
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
                <FieldLabel label="Email *">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
                <FieldLabel label="Phone">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+30 ..." className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
                <FieldLabel label="Mobile">
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+30 ..." className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
                <FieldLabel label="Date of Birth">
                  <Input value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} type="date" className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
                <FieldWithInfo label="Nationality" tooltip="Customer's nationality, used for charter documentation and port authority requirements">
                  <Combobox
                    value={nationality}
                    onChange={setNationality}
                    options={NATIONALITIES}
                    placeholder="Select nationality..."
                    label="nationalities"
                  />
                </FieldWithInfo>
                <FieldWithInfo label="Country" tooltip="Customer's country of residence">
                  <Combobox
                    value={country}
                    onChange={setCountry}
                    options={COUNTRIES}
                    placeholder="Select country..."
                    label="countries"
                  />
                </FieldWithInfo>
              </div>
            </SectionCard>

            {/* Address */}
            <SectionCard title="Address">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <FieldWithInfo label="Address" tooltip="Start typing to search — city and country will be filled automatically from the geocoding result">
                    <div className="relative">
                      <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "var(--on-surface-variant)", opacity: 0.5 }} />
                      <Input
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        placeholder="Start typing to search address..."
                        className="h-8 text-xs pl-7"
                        style={inputStyle}
                      />
                      {addressLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3 animate-spin" style={{ color: "var(--primary)" }} />}
                    </div>
                  </FieldWithInfo>
                  {addressSuggestions.length > 0 && (
                    <div
                      className="absolute z-50 mt-1 w-full rounded-md border shadow-lg max-h-48 overflow-y-auto"
                      style={{ background: "var(--surface-container-lowest)", borderColor: "var(--outline-variant)" }}
                    >
                      {addressSuggestions.map((s, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 transition-colors flex items-start gap-2"
                          style={{ color: "var(--on-surface)" }}
                          onClick={() => selectAddress(s)}
                        >
                          <MapPin className="size-3 shrink-0 mt-0.5" style={{ color: "var(--primary)", opacity: 0.6 }} />
                          <span>{s.display}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FieldLabel label="City">
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-8 text-xs" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label="Postcode">
                    <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="h-8 text-xs" style={inputStyle} />
                  </FieldLabel>
                  <FieldWithInfo label="Country" tooltip="Auto-filled from address search, or select manually above">
                    <Input value={country} readOnly className="h-8 text-xs" style={{ ...inputStyle, opacity: 0.7 }} />
                  </FieldWithInfo>
                </div>
              </div>
            </SectionCard>

            {/* Sailing Profile */}
            <SectionCard title="Sailing Profile">
              <div className="flex flex-col gap-3">
                <FieldWithInfo label="Sailing Experience" tooltip="Customer's self-reported sailing experience level, used for bareboat charter eligibility">
                  <Select value={sailingExperience} onValueChange={setSailingExperience}>
                    <SelectTrigger className="h-8 text-xs" style={inputStyle}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithInfo>

                <FieldWithInfo label="Certifications" tooltip="Sailing certifications held by the customer. Required for bareboat charters in most jurisdictions">
                  <div className="flex flex-wrap gap-1.5">
                    {CERTIFICATIONS.map((cert) => {
                      const active = certifications.includes(cert)
                      return (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => toggleCertification(cert)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors"
                          style={{
                            background: active ? "rgba(33,150,243,0.12)" : "transparent",
                            borderColor: active ? "#1976D2" : "var(--outline-variant)",
                            color: active ? "#1976D2" : "var(--on-surface-variant)",
                          }}
                        >
                          {cert}
                          {active && <X className="size-3" />}
                        </button>
                      )
                    })}
                  </div>
                </FieldWithInfo>
              </div>
            </SectionCard>

            {/* Travel Documents */}
            <SectionCard title="Travel Documents">
              <div className="grid grid-cols-2 gap-3">
                <FieldWithInfo label="Passport Number" tooltip="Required for charter agreements and port authority documentation">
                  <Input value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} className="h-8 text-xs" style={inputStyle} />
                </FieldWithInfo>
                <FieldWithInfo label="Passport Expiry" tooltip="Passport must be valid for at least 6 months after charter end date">
                  <Input value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} type="date" className="h-8 text-xs" style={inputStyle} />
                </FieldWithInfo>
              </div>
            </SectionCard>

            {/* Emergency Contact */}
            <SectionCard title="Emergency Contact">
              <div className="grid grid-cols-2 gap-3">
                <FieldWithInfo label="Contact Name" tooltip="Emergency contact person to reach in case of incidents during charter">
                  <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Full name" className="h-8 text-xs" style={inputStyle} />
                </FieldWithInfo>
                <FieldLabel label="Contact Phone">
                  <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="+44 ..." className="h-8 text-xs" style={inputStyle} />
                </FieldLabel>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="flex flex-col gap-4">
            {/* Bookings */}
            <SectionCard title="Bookings">
              <div className="flex flex-col gap-2">
                <p className="text-sm" style={{ color: "var(--on-surface)" }}>
                  <span className="font-semibold">{customer._count.bookings}</span>{" "}
                  <span style={{ color: "var(--on-surface-variant)" }}>booking{customer._count.bookings !== 1 ? "s" : ""}</span>
                </p>
                {customer._count.bookings > 0 && (
                  <Link
                    href={`/admin/bookings?customerId=${customer.id}`}
                    className="text-xs underline"
                    style={{ color: "var(--primary)" }}
                  >
                    View bookings
                  </Link>
                )}
              </div>
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this customer..."
                className="text-xs min-h-32"
                style={inputStyle}
              />
            </SectionCard>

            {/* Meta */}
            <SectionCard title="Details">
              <div className="flex flex-col gap-1.5 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                <p>Created: {new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <p>Updated: {new Date(customer.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <p className="font-mono text-[10px] mt-1" style={{ opacity: 0.5 }}>ID: {customer.id}</p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
