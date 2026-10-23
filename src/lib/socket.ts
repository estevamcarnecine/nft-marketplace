import { io, type Socket } from 'socket.io-client'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types'
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

export function getSocket(): RealtimeSocket {
  if (!socket) {
    socket = io(REALTIME_URL, { transports: ['websocket'], autoConnect: false })
  }
  return socket
}

export function connectSocket(): RealtimeSocket {
  clearTimeout(pendingDisconnect)
  const instance = getSocket()
  if (!instance.active) instance.connect()
  return instance
}

/**
 * Deferred by a tick, so an immediate remount (React StrictMode in dev) keeps the same connection
 * instead of closing one mid-handshake and opening another.
 */
export function disconnectSocket(): void {
  clearTimeout(pendingDisconnect)
  pendingDisconnect = setTimeout(() => socket?.disconnect(), 0)
}
