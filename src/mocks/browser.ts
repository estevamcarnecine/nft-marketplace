import { setupWorker } from 'msw/browser'
import { resetDb } from './db'
import { handlers } from './handlers'
import { applyScenarioFromUrl, resetScenario, scenario, setScenario } from './scenario'
import { startRealtime } from './socket'

declare global {
  interface Window {
    __mock?: {
      scenario: typeof scenario
      set: typeof setScenario
      reset: typeof resetScenario
      resetDb: typeof resetDb
    }
  }
}

export async function startMocks(): Promise<void> {
  applyScenarioFromUrl(window.location.search)

  window.__mock = {
    scenario,
    set: setScenario,
    reset: resetScenario,
    resetDb,
  }

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  startRealtime()
}