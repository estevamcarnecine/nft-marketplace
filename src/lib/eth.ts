const DECIMALS = 18
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export function isValidEth(value: string): boolean {
  return ETH_PATTERN.test(value)
}

export function toWei(eth: string): bigint {
  if (!isValidEth(eth)) throw new Error(`Invalid ETH amount: "${eth}"`)
  const [whole, fraction = ''] = eth.split('.')
  return BigInt(whole + fraction.padEnd(DECIMALS, '0'))
}

export function fromWei(wei: bigint): string {
  if (wei < 0n) throw new Error('Negative ETH amounts are not supported')
  const padded = wei.toString().padStart(DECIMALS + 1, '0')
  const whole = padded.slice(0, -DECIMALS)
  const fraction = padded.slice(-DECIMALS).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}

export function addEth(a: string, b: string): string {
  return fromWei(toWei(a) + toWei(b))
}

export function subEth(a: string, b: string): string {
  return fromWei(toWei(a) - toWei(b))
}

export function sumEth(values: string[]): string {
  return fromWei(values.reduce((total, value) => total + toWei(value), 0n))
}

export function mulEthInt(eth: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Invalid quantity: ${quantity}`)
  }
  return fromWei(toWei(eth) * BigInt(quantity))
}

export function percentOfEth(eth: string, percent: number): string {
  if (!Number.isInteger(percent) || percent < 0) {
    throw new Error(`Invalid percent: ${percent}`)
  }
  return fromWei((toWei(eth) * BigInt(percent)) / 100n)
}

export function compareEth(a: string, b: string): number {
  const diff = toWei(a) - toWei(b)
  return diff < 0n ? -1 : diff > 0n ? 1 : 0
}

export function formatEth(eth: string, minDecimals = 2, maxDecimals = 3): string {
  const unit = 10n ** BigInt(DECIMALS - maxDecimals)
  const rounded = ((toWei(eth) + unit / 2n) / unit) * unit
  const [whole, fraction = ''] = fromWei(rounded).split('.')
  return `${whole}.${fraction.padEnd(minDecimals, '0')}`
}