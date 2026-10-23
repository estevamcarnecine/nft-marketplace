import { setupWorker } from 'msw/browser'
import { resumePendingOrders } from './domain'
import { handlers } from './handlers'
import { loadPersisted, resetMockData } from './persistence'
import { applyScenarioFromUrl, resetScenario, scenario, setScenario } from './scenario'
import { startRealtime } from './socket'

declare global {
  interface Window {
    __mock?: {
      scenario: typeof scenario
      set: typeof setScenario
      /** Restores the fixture baseline and clears the scenario. */
      reset: () => void
    }
  }
}

function dropResetParam(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('mock')
  window.history.replaceState(window.history.state, '', url)
}

export async function startMocks(): Promise<void> {
  if (applyScenarioFromUrl(window.location.search)) {
    resetMockData()
    // A later reload must not wipe the data again.
    dropResetParam()
  } else {
    loadPersisted()
  }
  // Orders that were pending when the page closed keep settling after a reload.
  resumePendingOrders()

  window.__mock = {
    scenario,
    set: setScenario,
    reset: () => {
      resetScenario()
      resetMockData()
    },
  }

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: import.meta.env.MODE === 'production',
  })
  startRealtime()
}
