import { useSyncExternalStore } from 'react'

/**
 * Below this width the app uses the mobile frames (centered and wider on tablets): the desktop
 * frames need the 1200px column plus gutters. Tablet sizes have no frames of their own.
 */
export const DESKTOP_QUERY = '(min-width: 1280px)'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY)
}
