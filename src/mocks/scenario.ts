export interface Scenario {
  latencyMs: number
  ticks: boolean
  priceChangeOnNextOrder: boolean
  orderOutcome: 'completed' | 'failed'
  failures: Record<string, { status: number; times: number }>
}

const defaults = (): Scenario => ({
  latencyMs: 250,
  ticks: false,
  priceChangeOnNextOrder: false,
  orderOutcome: 'completed',
  failures: {},
})

export const scenario: Scenario = defaults()

export function setScenario(patch: Partial<Scenario>): void {
  Object.assign(scenario, patch)
}

export function resetScenario(): void {
  Object.assign(scenario, defaults())
}

export function takeFailure(key: string): number | null {
  const failure = scenario.failures[key]
  if (!failure || failure.times <= 0) return null
  failure.times -= 1
  return failure.status
}

export function applyScenarioFromUrl(search: string): void {
  const raw = new URLSearchParams(search).get('mock')
  if (!raw) return

  for (const token of raw.split(',')) {
    const [name, a, b, c] = token.split(':')
    switch (name) {
      case 'latency': {
        const ms = Number(a)
        if (Number.isFinite(ms) && ms >= 0) scenario.latencyMs = ms
        break
      }
      case 'ticks':
        scenario.ticks = true
        break
      case 'pricechange':
        scenario.priceChangeOnNextOrder = true
        break
      case 'orderfail':
        scenario.orderOutcome = 'failed'
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