import { useSyncExternalStore } from 'react'

export interface CartNotice {
  /** One notice per NFT and kind: a newer change replaces the previous message. */
  id: string
  message: string
}

let notices: CartNotice[] = []
const listeners = new Set<() => void>()

function emit(next: CartNotice[]): void {
  notices = next
  for (const listener of listeners) listener()
}

export function pushCartNotice(notice: CartNotice): void {
  emit([...notices.filter((item) => item.id !== notice.id), notice])
}

export function dismissCartNotice(id: string): void {
  emit(notices.filter((item) => item.id !== id))
}

export function clearCartNotices(): void {
  if (notices.length > 0) emit([])
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCartNotices(): CartNotice[] {
  return useSyncExternalStore(subscribe, () => notices)
}
