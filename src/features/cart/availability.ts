import type { CartLine } from '@/types'

/** A line asks for more units than its edition still has (e.g. after an `nft.updated` event). */
export function isLineUnavailable(line: CartLine): boolean {
  return line.quantity > line.edition.available
}
