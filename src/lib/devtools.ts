import { http } from './api'
import { getSocket } from './socket'

declare global {
  interface Window {
    __dev?: {
      http: typeof http
      getSocket: typeof getSocket
    }
  }
}

export function exposeDevtools(): void {
  window.__dev = { http, getSocket }
}
