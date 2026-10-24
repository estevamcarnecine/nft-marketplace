import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { REALTIME_URL } from '@/lib/config'
import type { EditionId, NftUpdatedEvent, Order, OrderUpdatedEvent } from '@/types'
import { adjustNftPrice, db, findEdition, findNft, syncAvailability, type NftRecord } from './db'
import { schedulePersist } from './persistence'
import { scenario } from './scenario'
import { userIdForToken } from './session'

type SocketIo = ReturnType<typeof toSocketIo>

interface Client {
  io: SocketIo
  userId: string | null
}

const link = ws.link(REALTIME_URL)
const clients = new Set<Client>()
let dropScheduled = false

function scheduleDrop(): void {
  if (dropScheduled || scenario.socketDropAfterMs === null) return
  dropScheduled = true
  setTimeout(() => dropAllSockets(), scenario.socketDropAfterMs)
}

export const realtimeHandler = link.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  const client: Client = { io, userId: null }
  clients.add(client)

  io.client.on('session.subscribe', (_event, payload: unknown) => {
    const token = typeof payload === 'object' && payload !== null ? (payload as { token?: unknown }).token : undefined
    client.userId = typeof token === 'string' ? userIdForToken(token) : null
    io.client.emit('session.ready', { authenticated: client.userId !== null })
  })
  io.client.on('session.unsubscribe', () => {
    client.userId = null
  })
  connection.client.addEventListener('close', () => {
    clients.delete(client)
  })
  scheduleDrop()
})

export function dropAllSockets(): void {
  for (const client of [...clients]) client.io.rawClient.close(4000, 'simulated drop')
  clients.clear()
}

function deliver(targets: Iterable<Client>, event: NftUpdatedEvent | OrderUpdatedEvent): void {
  for (const client of targets) {
    client.io.client.emit(event.type, event)
    if (scenario.duplicateEvents) client.io.client.emit(event.type, event)
  }
}

function nftEvent(nft: NftRecord, version = nft.version): NftUpdatedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resource: { kind: 'nft', id: nft.id },
    version,
    occurredAt: new Date().toISOString(),
    data: {
      price: nft.price,
      available: nft.available,
      editions: nft.editions.map((edition) => ({ id: edition.id, available: edition.available })),
    },
  }
}

export function emitNftUpdated(nft: NftRecord): void {
  const event = nftEvent(nft)
  deliver(clients, event)
  if (scenario.staleEvents) {
    const stale: NftUpdatedEvent = {
      ...nftEvent(nft, nft.version - 1),
      data: { ...event.data, price: '0.01', available: 999 },
    }
    setTimeout(() => deliver(clients, stale), 300)
  }
}

export function emitOrderUpdated(userId: string, order: Order): void {
  const event: OrderUpdatedEvent = {
    eventId: crypto.randomUUID(),
    type: 'order.updated',
    resource: { kind: 'order', id: order.id },
    version: order.version,
    occurredAt: order.updatedAt,
    data: { status: order.status, txHash: order.txHash, rejectionReason: order.rejectionReason },
  }
  deliver(
    [...clients].filter((client) => client.userId === userId),
    event,
  )
}

export const realtimeControls = {
  changePrice(nftId: string, percent: number): boolean {
    const nft = adjustNftPrice(nftId, percent)
    if (!nft) return false
    emitNftUpdated(nft)
    schedulePersist()
    return true
  },
  setStock(nftId: string, editionId: EditionId, available: number): boolean {
    const nft = findNft(nftId)
    const edition = nft && findEdition(nft, editionId)
    if (!nft || !edition) return false
    edition.available = Math.max(0, Math.floor(available))
    syncAvailability(nft)
    emitNftUpdated(nft)
    schedulePersist()
    return true
  },
  dropSockets: dropAllSockets,
  connectedSockets: () => [...clients].map((client) => ({ userId: client.userId })),
}

let tickerId: ReturnType<typeof setInterval> | undefined

export function startRealtime(): void {
  if (tickerId !== undefined) return
  tickerId = setInterval(() => {
    if (!scenario.ticks) return
    const nft = db.nfts[Math.floor(Math.random() * db.nfts.length)]
    if (!nft) return
    const direction = Math.random() < 0.5 ? -1 : 1
    realtimeControls.changePrice(nft.id, direction * (1 + Math.floor(Math.random() * 5)))
  }, 6000)
}
