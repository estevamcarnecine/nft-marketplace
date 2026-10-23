// The page-side controls exposed by src/mocks/browser.ts, as the specs use them inside evaluate().
export {}

declare global {
  interface Window {
    __mock: {
      set: (patch: Record<string, unknown>) => void
      reset: () => void
      realtime: {
        changePrice: (nftId: string, percent: number) => boolean
        setStock: (nftId: string, editionId: string, available: number) => boolean
        dropSockets: () => void
        connectedSockets: () => { userId: string | null }[]
      }
    }
  }
}
