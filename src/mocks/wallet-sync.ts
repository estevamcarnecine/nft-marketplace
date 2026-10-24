import { WALLET_TYPES } from '@/types'
import type { NetworkId, Profile, Wallet, WalletType } from '@/types'
import { db, nextId } from './db'

export function syncProfileFromDefault(userId: string): void {
  const profile = db.profiles.get(userId)
  if (!profile) return
  const wallets = db.wallets.get(userId) ?? []
  const primary = wallets.find((wallet) => wallet.isDefault)
  const next: Profile = primary
    ? {
        ...profile,
        walletNickname: primary.label,
        walletType: primary.type,
        network: primary.network,
        walletAddress: primary.address,
      }
    : { ...profile, walletNickname: '', walletType: '', network: '', walletAddress: '' }
  if (
    next.useAnotherWallet &&
    !wallets.some((wallet) => !wallet.isDefault && wallet.address === next.secondaryWallet)
  ) {
    next.useAnotherWallet = false
    next.secondaryWallet = ''
  }
  db.profiles.set(userId, next)
}

export function upsertDefaultWallet(
  userId: string,
  data: { label: string; type: WalletType; network: NetworkId; address: string },
): Wallet {
  const wallets = db.wallets.get(userId) ?? []
  const current = wallets.find((wallet) => wallet.isDefault)
  const label = data.label || (WALLET_TYPES.find((type) => type.id === data.type)?.label ?? data.type)
  if (current) {
    const updated: Wallet = { ...current, ...data, label }
    db.wallets.set(
      userId,
      wallets.map((wallet) => (wallet.id === current.id ? updated : wallet)),
    )
    return updated
  }
  const created: Wallet = {
    id: nextId('wallet'),
    ...data,
    label,
    isDefault: true,
    createdAt: new Date().toISOString(),
  }
  db.wallets.set(userId, [...wallets, created])
  return created
}
