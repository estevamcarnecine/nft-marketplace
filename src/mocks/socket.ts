import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { REALTIME_URL } from '@/lib/config'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types'
import { adjustNftPrice, db, toNftUpdated } from './db'
import { schedulePersist } from './persistence'
import { scenario } from './scenario'

type SocketIo = ReturnType<typeof toSocketIo>

const link = ws.link(REALTIME_URL)
const clients = new Set<SocketIo>()

export const realtimeHandler = link.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  clients.add(io)
  connection.client.addEventListener('close', () => {
    clients.delete(io)
  })
})

export function broadcast(event: 'nft.updated', payload: NftUpdatedEvent): void
export function broadcast(event: 'order.updated', payload: OrderUpdatedEvent): void
export function broadcast(event: string, payload: unknown): void {
  for (const io of clients) {
    io.client.emit(event, payload)
  }
}

let tickerId: ReturnType<typeof setInterval> | undefined

export function startRealtime(): void {
  if (tickerId !== undefined) return
  tickerId = setInterval(() => {
    if (!scenario.ticks) return
    const nft = db.nfts[Math.floor(Math.random() * db.nfts.length)]
    if (!nft) return
    const direction = Math.random() < 0.5 ? -1 : 1
    const updated = adjustNftPrice(nft.id, direction * (1 + Math.floor(Math.random() * 5)))
    if (updated) {
      broadcast('nft.updated', toNftUpdated(updated))
      schedulePersist()
    }
  }, 6000)
}