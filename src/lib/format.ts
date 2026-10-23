import { formatEth } from './eth'

export function formatEthLabel(eth: string): string {
  return `${formatEth(eth)} ETH`
}

/** 0x7A42c3…19E8 → 0x7A42...19E8 */
export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}

export function formatRating(rating: number): string {
  return rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
