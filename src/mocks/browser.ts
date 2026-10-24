import { setupWorker } from 'msw/browser'
import { resumePendingOrders } from './domain'
import { handlers } from './handlers'
import { loadPersisted, resetMockData } from './persistence'
import { applyScenarioFromUrl, resetScenario, scenario, setScenario } from './scenario'
import { realtimeControls, startRealtime } from './socket'

declare global {
  interface Window {
    __mock?: {
      scenario: typeof scenario
      set: typeof setScenario
      reset: () => void
      realtime: typeof realtimeControls
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
    dropResetParam()
  } else {
    loadPersisted()
  }
  resumePendingOrders()

  window.__mock = {
    scenario,
    set: setScenario,
    reset: () => {
      resetScenario()
      resetMockData()
    },
    realtime: realtimeControls,
  }

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
    quiet: import.meta.env.MODE === 'production',
  })
  startRealtime()
}
