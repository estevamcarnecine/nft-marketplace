/**
 * Deterministic network and business scenarios, chosen with `?mock=a,b,c` (kept for the browser
 * tab in sessionStorage, so they survive reloads) or `window.__mock.set()`. `?mock=reset` restores
 * the fixtures; `?mock=none` clears the scenario. Tokens are documented in README.md.
 */
export interface Scenario {
  latencyMs: number
  /** Seeded variable latency added on top of `latencyMs`. */
  jitter: [number, number] | null
  /** Catalog list requests alternate slow/fast, so an older request can resolve after a newer one. */
  outOfOrder: boolean
  /** Handler keys (or `*`) answered with a network error. */
  offline: string[]
  /** Handler keys whose response arrives after the client gives up. */
  timeouts: string[]
  ticks: boolean
  emptyCatalog: boolean
  priceChangeOnNextOrder: boolean
  soldOutOnNextOrder: boolean
  /** The next order is created, but its response only arrives after the client timeout. */
  orderTimeout: boolean
  orderOutcome: 'confirmed' | 'rejected'
  /** Time from order creation to the simulated payment result. */
  orderSettleMs: number
  walletReject: boolean
  /** Sessions opened before this instant are expired (scenario `session:expire[:ms]`). */
  sessionDeadline: number | null
  /** The server closes every socket this long after the first connection (`socket:drop[:ms]`). */
  socketDropAfterMs: number | null
  /** Every event is delivered twice with the same eventId (`event:dup`). */
  duplicateEvents: boolean
  /** Every nft.updated is followed by an older copy that must be ignored (`event:stale`). */
  staleEvents: boolean
  failures: Record<string, { status: number; times: number }>
}

export const TIMEOUT_DELAY_MS = 15_000
const STORAGE_KEY = 'kurio.mock.scenario'

const defaults = (): Scenario => ({
  latencyMs: 250,
  jitter: null,
  outOfOrder: false,
  offline: [],
  timeouts: [],
  ticks: false,
  emptyCatalog: false,
  priceChangeOnNextOrder: false,
  soldOutOnNextOrder: false,
  orderTimeout: false,
  orderOutcome: 'confirmed',
  orderSettleMs: 3000,
  walletReject: false,
  sessionDeadline: null,
  socketDropAfterMs: null,
  duplicateEvents: false,
  staleEvents: false,
  failures: {},
})

export const scenario: Scenario = defaults()

export function setScenario(patch: Partial<Scenario>): void {
  Object.assign(scenario, patch)
}

export function resetScenario(): void {
  Object.assign(scenario, defaults())
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sem armazenamento: o cenário vale só para esta página
  }
}

export function takeFailure(key: string): number | null {
  const failure = scenario.failures[key]
  if (!failure || failure.times <= 0) return null
  failure.times -= 1
  return failure.status
}

function matches(list: string[], key: string): boolean {
  return (
    list.includes('*') ||
    list.includes(key) ||
    list.some((item) => item.endsWith('.*') && key.startsWith(item.slice(0, -1)))
  )
}

export function isOffline(key: string): boolean {
  return matches(scenario.offline, key)
}

export function isTimedOut(key: string): boolean {
  return matches(scenario.timeouts, key)
}

// Seeded jitter: the same scenario produces the same sequence of delays on every run.
let jitterState = 7
function nextJitter(): number {
  jitterState = (jitterState * 1103515245 + 12345) % 2147483648
  return jitterState / 2147483648
}

let catalogRequests = 0

export function latencyFor(key: string): number {
  let ms = scenario.latencyMs
  if (scenario.jitter) {
    const [min, max] = scenario.jitter
    ms += Math.round(min + nextJitter() * (max - min))
  }
  if (scenario.outOfOrder && key === 'catalog.list') {
    catalogRequests += 1
    if (catalogRequests % 2 === 1) ms += 1500
  }
  return ms
}

function apply(raw: string): void {
  for (const token of raw.split(',').map((part) => part.trim()).filter(Boolean)) {
    const [name, a, b, c] = token.split(':')
    switch (name) {
      case 'latency': {
        const ms = Number(a)
        if (Number.isFinite(ms) && ms >= 0) scenario.latencyMs = ms
        break
      }
      case 'jitter': {
        const [min, max] = (a ?? '').split('-').map(Number)
        if (Number.isFinite(min) && Number.isFinite(max) && max >= min) scenario.jitter = [min, max]
        break
      }
      case 'outoforder':
        scenario.outOfOrder = true
        break
      case 'offline':
        scenario.offline.push(a || '*')
        break
      case 'timeout':
        if (a) scenario.timeouts.push(a)
        break
      case 'ticks':
        scenario.ticks = true
        break
      case 'empty':
        scenario.emptyCatalog = true
        break
      case 'pricechange':
        scenario.priceChangeOnNextOrder = true
        break
      case 'soldout':
        scenario.soldOutOnNextOrder = true
        break
      case 'ordertimeout':
        scenario.orderTimeout = true
        break
      case 'orderfail':
        scenario.orderOutcome = 'rejected'
        break
      case 'orderdelay': {
        const ms = Number(a)
        if (Number.isFinite(ms) && ms >= 0) scenario.orderSettleMs = ms
        break
      }
      case 'walletreject':
        scenario.walletReject = true
        break
      case 'session': {
        const value = Number(b ?? 0)
        if (a === 'expire') scenario.sessionDeadline = Date.now() + (Number.isFinite(value) ? value : 0)
        // Saved form of `session:expire`: the absolute deadline, so a reload does not move it.
        if (a === 'expireat' && Number.isFinite(value)) scenario.sessionDeadline = value
        break
      }
      case 'socket':
        if (a === 'drop') {
          const ms = Number(b ?? 4000)
          scenario.socketDropAfterMs = Number.isFinite(ms) ? ms : 4000
        }
        break
      case 'event':
        if (a === 'dup') scenario.duplicateEvents = true
        if (a === 'stale') scenario.staleEvents = true
        break
      case 'fail': {
        const status = Number(b)
        const times = c ? Number(c) : 1
        if (a && Number.isInteger(status) && Number.isInteger(times)) {
          scenario.failures[a] = { status, times }
        }
        break
      }
    }
  }
}

/** Reads `?mock=` (or the tab's saved scenario) and applies it. Returns true when a reset was asked. */
export function applyScenarioFromUrl(search: string): boolean {
  const raw = new URLSearchParams(search).get('mock')
  if (raw === 'reset' || raw === 'none') {
    resetScenario()
    return raw === 'reset'
  }
  // Relative deadlines are pinned when chosen, so reloading the page keeps the same instant.
  let tokens = raw?.replace(/session:expire(?::(\d+))?/g, (_match, ms?: string) => `session:expireat:${Date.now() + Number(ms ?? 0)}`) ?? null
  try {
    if (tokens) sessionStorage.setItem(STORAGE_KEY, tokens)
    else tokens = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    // sem armazenamento: só o parâmetro da URL vale
  }
  if (tokens) apply(tokens)
  return false
}
