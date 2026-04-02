/**
 * NAUSYS CBMS REST API V6 Client
 *
 * All endpoints use POST with { username, password } in JSON body.
 * Yacht list uses /catalogue/v6/yachts/{charterCompanyId} — returns full yacht data.
 * Pictures: https://ws.nausys.com/CBMS-external/rest/yacht/{yachtId}/pictures/main.jpg?w=600
 */

export interface NausysCredentials {
  username: string
  password: string
  endpoint: string
  companyId: string
}

// ── i18n text from NAUSYS ──

interface NausysNameI18n {
  textEN?: string
  textDE?: string
  textEL?: string
  textHR?: string
  textFR?: string
  textIT?: string
  textES?: string
  [key: string]: string | undefined
}

export function i18nToJson(n: NausysNameI18n | undefined | null): Record<string, string> {
  if (!n) return {}
  return { en: n.textEN || "", el: n.textEL || "", de: n.textDE || "" }
}

export function parseNausysDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split(".")
  return new Date(`${year}-${month}-${day}T00:00:00Z`)
}

// ── API call helper ──

async function nausysPost<T>(creds: NausysCredentials, path: string, extra: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${creds.endpoint}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: creds.username, password: creds.password, ...extra }),
    signal: AbortSignal.timeout(60000),
  })
  const data = await res.json()
  if (data.status === "AUTHENTICATION_ERROR") throw new Error("NAUSYS authentication failed")
  if (data.status !== "OK") throw new Error(`NAUSYS API error: ${JSON.stringify(data).substring(0, 200)}`)
  return data as T
}

// ── Catalogue types ──

export interface RawCategory { id: number; name: NausysNameI18n }
export interface RawBuilder { id: number; name: string }
export interface RawModel {
  id: number; name: string; yachtCategoryId: number; yachtBuilderId: number
  loa?: number; beam?: number; draft?: number; cabins?: number; wc?: number
  waterTank?: number; fuelTank?: number; displacement?: number; virtualLength?: number
}
export interface RawSailType { id: number; name: NausysNameI18n }
export interface RawSteeringType { id: number; name: NausysNameI18n }
export interface RawCountry { id: number; code?: string; code2?: string; name: NausysNameI18n }
export interface RawRegion { id: number; countryId: number; name: NausysNameI18n }
export interface RawLocation { id: number; regionId?: number; lat?: number; lon?: number; name: NausysNameI18n }
export interface RawBase {
  id: number; locationId: number; companyId?: number
  checkInTime?: string; checkOutTime?: string; lat?: number; lon?: number
  secondaryBase?: boolean; disabled?: boolean
}
export interface RawEquipmentCategory { id: number; name: NausysNameI18n }
export interface RawEquipment { id: number; categoryId: number; name: NausysNameI18n }
export interface RawService { id: number; depositInsurance?: boolean; name: NausysNameI18n }
export interface RawPriceMeasure { id: number; name: NausysNameI18n }
export interface RawDiscount { id: number; name: NausysNameI18n }
export interface RawSeason {
  id: number; charterCompanyId?: number; season: string
  from: string; to: string; defaultSeason?: boolean; locationsId?: number[]
}

// ── Yacht types (from /catalogue/v6/yachts/{companyId}) ──

export interface RawYachtPicture {
  src: string
  description?: NausysNameI18n
  isGenuine?: boolean
  catalogPhoto?: boolean
  layoutPicture?: boolean
  mainPicture?: boolean
  lastModified?: string
}

export interface RawYachtEquipment {
  id: number
  equipmentId: number
  quantity: number
  highlight?: boolean
  comment?: NausysNameI18n
}

export interface RawCheckInPeriod {
  dateFrom: string; dateTo: string
  minimalReservationDuration?: number; minimumShortPeriodDuration?: number
  checkInMonday: boolean; checkInTuesday: boolean; checkInWednesday: boolean
  checkInThursday: boolean; checkInFriday: boolean; checkInSaturday: boolean; checkInSunday: boolean
  checkOutMonday: boolean; checkOutTuesday: boolean; checkOutWednesday: boolean
  checkOutThursday: boolean; checkOutFriday: boolean; checkOutSaturday: boolean; checkOutSunday: boolean
}

export interface RawOneWayPeriod {
  id: number; baseId?: number; locationId?: number
  periodFrom: string; periodTo: string; destinationIds?: number[]
}

export interface RawYachtPrice {
  id: number; dateFrom: string; dateTo: string; price: number
  currency: string; type: string; vatInPrice?: string; locationsId?: number[]
}

export interface RawExtraEquipment {
  id: number; equipmentId: number; quantity?: number
  price?: string; currency?: string; priceMeasureId?: number
  calculationType?: string; amount?: string; vatInPrice?: string
  condition?: NausysNameI18n; comment?: NausysNameI18n
  availableOnAgencyPortal?: boolean
}

export interface RawYachtService {
  id: number; serviceId: number; price?: string; currency?: string
  priceMeasureId?: number; calculationType?: string; obligatory?: boolean
  amount?: string; vatInPrice?: string; description?: NausysNameI18n
  onRequestOnly?: boolean; availableOnAgencyPortal?: boolean
}

export interface RawSeasonData {
  seasonId: number; baseId?: number; locationId?: number
  agencyVisible?: boolean
  prices: RawYachtPrice[]
  additionalYachtEquipment: RawExtraEquipment[]
  services: RawYachtService[]
  regularDiscounts: { discountItemId: number; amount: number; type: string }[]
}

export interface RawYacht {
  id: number; name: string; companyId?: number
  baseId?: number; locationId?: number; yachtModelId?: number
  charterType?: string; crewedCharterType?: string
  // Specs
  cabins?: number; cabinsCrew?: number
  berthsCabin?: number; berthsSalon?: number; berthsCrew?: number; berthsTotal?: number
  wc?: number; wcCrew?: number; showers?: number; showersCrew?: number
  buildYear?: number; launchedYear?: number
  draft?: number; engines?: number; enginePower?: number
  fuelTank?: number; waterTank?: number; fuelConsumption?: number
  numberOfRudderBlades?: number; maxSpeed?: number; crusingSpeed?: number
  sailTypeId?: number; steeringTypeId?: number
  // Flags
  isPremium?: boolean; onSale?: boolean; disabled?: boolean
  needsOptionApproval?: boolean; canMakeBookingFixed?: boolean
  registrationCertified?: boolean; fourStarCharter?: boolean
  // Financial
  deposit?: number; depositCurrency?: string; depositWhenInsured?: number
  maxDiscount?: number
  // Text
  highlights?: string; highlightsIntText?: NausysNameI18n
  // Media
  mainPictureUrl?: string; picturesURL?: string[]; pictures?: RawYachtPicture[]
  // Check-in
  checkInTime?: string; checkOutTime?: string
  checkInPeriods?: RawCheckInPeriod[]
  oneWayPeriods?: RawOneWayPeriod[]
  // Nested data
  standardYachtEquipment?: RawYachtEquipment[]
  seasonSpecificData?: RawSeasonData[]
  flagsId?: number[]
  yachtAmenities?: unknown[]
}

// ── Catalogue fetchers ──

export const fetchCategories = (c: NausysCredentials) =>
  nausysPost<{ categories: RawCategory[] }>(c, "/catalogue/v6/yachtCategories").then((d) => d.categories)

export const fetchYachtBuilders = (c: NausysCredentials) =>
  nausysPost<{ builders: RawBuilder[] }>(c, "/catalogue/v6/yachtBuilders").then((d) => d.builders)

export const fetchEngineBuilders = (c: NausysCredentials) =>
  nausysPost<{ builders: RawBuilder[] }>(c, "/catalogue/v6/engineBuilders").then((d) => d.builders)

export const fetchYachtModels = (c: NausysCredentials) =>
  nausysPost<{ models: RawModel[] }>(c, "/catalogue/v6/yachtModels").then((d) => d.models)

export const fetchSailTypes = (c: NausysCredentials) =>
  nausysPost<{ sailTypes: RawSailType[] }>(c, "/catalogue/v6/sailTypes").then((d) => d.sailTypes)

export const fetchSteeringTypes = (c: NausysCredentials) =>
  nausysPost<{ steeringTypes: RawSteeringType[] }>(c, "/catalogue/v6/steeringTypes").then((d) => d.steeringTypes)

export const fetchCountries = (c: NausysCredentials) =>
  nausysPost<{ countries: RawCountry[] }>(c, "/catalogue/v6/countries").then((d) => d.countries)

export const fetchRegions = (c: NausysCredentials) =>
  nausysPost<{ regions: RawRegion[] }>(c, "/catalogue/v6/regions").then((d) => d.regions)

export const fetchLocations = (c: NausysCredentials) =>
  nausysPost<{ locations: RawLocation[] }>(c, "/catalogue/v6/locations").then((d) => d.locations)

export const fetchCharterBases = (c: NausysCredentials) =>
  nausysPost<{ bases: RawBase[] }>(c, "/catalogue/v6/charterBases").then((d) => d.bases)

export const fetchEquipmentCategories = (c: NausysCredentials) =>
  nausysPost<{ equipmentCategories: RawEquipmentCategory[] }>(c, "/catalogue/v6/equipmentCategories").then((d) => d.equipmentCategories)

export const fetchEquipment = (c: NausysCredentials) =>
  nausysPost<{ equipment: RawEquipment[] }>(c, "/catalogue/v6/equipment").then((d) => d.equipment)

export const fetchServices = (c: NausysCredentials) =>
  nausysPost<{ services: RawService[] }>(c, "/catalogue/v6/services").then((d) => d.services)

export const fetchPriceMeasures = (c: NausysCredentials) =>
  nausysPost<{ priceMeasures: RawPriceMeasure[] }>(c, "/catalogue/v6/priceMeasures").then((d) => d.priceMeasures)

export const fetchDiscountItems = (c: NausysCredentials) =>
  nausysPost<{ discounts: RawDiscount[] }>(c, "/catalogue/v6/discountItems").then((d) => d.discounts)

export const fetchSeasons = (c: NausysCredentials) =>
  nausysPost<{ seasons: RawSeason[] }>(c, "/catalogue/v6/seasons").then((d) => d.seasons)

// ── Yacht list (the big one) ──

export async function fetchAllYachts(creds: NausysCredentials): Promise<RawYacht[]> {
  if (!creds.companyId) throw new Error("Charter Company ID not configured")
  const res = await fetch(`${creds.endpoint}/catalogue/v6/yachts/${creds.companyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: creds.username, password: creds.password }),
    signal: AbortSignal.timeout(120000),
  })
  const data = await res.json()
  if (data.status === "AUTHENTICATION_ERROR") throw new Error("NAUSYS authentication failed")
  if (data.status !== "OK") throw new Error(`NAUSYS API error: ${JSON.stringify(data).substring(0, 200)}`)
  return data.yachts ?? []
}

// ── Yacht availability check ──

export interface FreeYachtResult {
  periodFrom: string
  periodTo: string
  yachtId: number
  locationFromId: number
  locationToId: number
  price?: {
    priceListPrice: string
    clientPrice: string
    discounts?: Array<{ discountItemId: number; amount: number; type: string }>
  }
}

/**
 * Check availability for specific yachts in a date range.
 * Uses the "Free yacht" NAUSYS endpoint (/yachtReservation/v6/freeYachts).
 * Date format expected by NAUSYS: "DD.MM.YYYY"
 */
export async function fetchFreeYacht(
  creds: NausysCredentials,
  periodFrom: string,
  periodTo: string,
  yachtIds: number[]
): Promise<FreeYachtResult[]> {
  const res = await fetch(`${creds.endpoint}/yachtReservation/v6/freeYachts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      credentials: { username: creds.username, password: creds.password },
      periodFrom,
      periodTo,
      yachts: yachtIds,
    }),
    signal: AbortSignal.timeout(30000),
  })
  const data = await res.json()
  if (data.status !== "OK") return []
  return data.freeYachts ?? []
}
