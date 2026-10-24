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
  'session.subscribe': (payload: { token: string }) => void
  'session.unsubscribe': () => void
}

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: RealtimeSocket | null = null
let pendingDisconnect: ReturnType<typeof setTimeout> | undefined

export function getSocket(): RealtimeSocket | null {
  return socket
}

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

export function disconnectSocket(): void {
  clearTimeout(pendingDisconnect)
  pendingDisconnect = setTimeout(() => socket?.disconnect(), 0)
}
