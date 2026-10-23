import { io, type Socket } from 'socket.io-client'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types'
import { REALTIME_URL } from './config'

interface ServerToClientEvents {
  'nft.updated': (payload: NftUpdatedEvent) => void
  'order.updated': (payload: OrderUpdatedEvent) => void
}

export type RealtimeSocket = Socket<ServerToClientEvents>

let socket: RealtimeSocket | null = null

export function getSocket(): RealtimeSocket {
  if (!socket) {
    socket = io(REALTIME_URL, { transports: ['websocket'], autoConnect: false })
  }
  return socket
}

export function connectSocket(): RealtimeSocket {
  const instance = getSocket()
  if (!instance.connected) instance.connect()
  return instance
}

export function disconnectSocket(): void {
  socket?.disconnect()
}