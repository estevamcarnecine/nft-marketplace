import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types'

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

const MAX_SEEN_EVENTS = 500

const seen = new Set<string>()
const lastVersion = new Map<string, number>()

export function acceptEvent(event: RealtimeEvent): boolean {
  if (seen.has(event.eventId)) return false
  seen.add(event.eventId)
  if (seen.size > MAX_SEEN_EVENTS) {
    const oldest = seen.values().next().value
    if (oldest !== undefined) seen.delete(oldest)
  }

  const key = `${event.resource.kind}:${event.resource.id}`
  if (event.version <= (lastVersion.get(key) ?? 0)) return false
  lastVersion.set(key, event.version)
  return true
}
