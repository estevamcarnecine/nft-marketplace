import type { CartLine } from '@/types'

export function isLineUnavailable(line: CartLine): boolean {
  return line.quantity > line.edition.available
}
