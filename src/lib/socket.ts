import type { Socket } from 'socket.io-client'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types'
import { apiReady } from './api-ready'
import { REALTIME_URL } from './config'

interface ServerToClientEvents {
  'nft.updated': (payload: NftUpdatedEvent) => void
  'order.updated': (payload: OrderUpdatedEvent) => void
  'session.ready': (payload: { authenticated: boolean }) => void
}

interface ClientToServerEvents {
  /** Binds this socket to the session, so the server sends it that user's order events. */
  'session.subscribe': (payload: { token: string }) => void
  'session.unsubscribe': () => void
}

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: RealtimeSocket | null = null
let pendingDisconnect: ReturnType<typeof setTimeout> | undefined

export function getSocket(): RealtimeSocket | null {
  return socket
}

/**
 * socket.io-client is loaded on first use: its WebSocket transport reads the global `WebSocket`
 * when the module is evaluated, which must happen after the mocks patch it. Loading it lazily also
 * keeps it out of the bundle the first paint waits for.
 */
export async function connectSocket(): Promise<RealtimeSocket> {
  clearTimeout(pendingDisconnect)
  if (!socket) {
    await apiReady
    const { io } = await import('socket.io-client')
    socket ??= io(REALTIME_URL, { transports: ['websocket'], autoConnect: false })
  }
  if (!socket.active) socket.connect()
  return socket
}

/**
 * Deferred by a tick, so an immediate remount (React StrictMode in dev) keeps the same connection
 * instead of closing one mid-handshake and opening another.
 */
export function disconnectSocket(): void {
  clearTimeout(pendingDisconnect)
  pendingDisconnect = setTimeout(() => socket?.disconnect(), 0)
}
