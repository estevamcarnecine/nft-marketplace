import { formatEth } from './eth'

export function formatEthLabel(eth: string): string {
  return `${formatEth(eth)} ETH`
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}

export function shortHash(hash: string): string {
  return hash.length > 12
    ? `${hash.slice(0, 6).toUpperCase().replace('0X', '0x')}…${hash.slice(-4).toUpperCase()}`
    : hash
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso)
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${date.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${date.getFullYear()}`
}

export function formatRating(rating: number): string {
  return rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
