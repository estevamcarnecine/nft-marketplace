import { useSyncExternalStore } from 'react'

let connected = false
const listeners = new Set<() => void>()

export function setRealtimeConnected(value: boolean): void {
  if (connected === value) return
  connected = value
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(subscribe, () => connected)
}
