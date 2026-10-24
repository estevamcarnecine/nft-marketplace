import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/500.css'
import '@fontsource/roboto-mono/700.css'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { markApiReady } from '@/lib/api-ready'
import { queryClient } from '@/lib/queryClient'

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    try {
      const { startMocks } = await import('./mocks/browser')
      await startMocks()
    } catch (error) {
      console.error('[mocks] failed to start', error)
    }
  }

  if (import.meta.env.DEV) {
    const { exposeDevtools } = await import('./lib/devtools')
    exposeDevtools()
  }
}

void enableMocking()
  .finally(markApiReady)
  .then(() => import('./router'))
  .then(({ router }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    )
  })
