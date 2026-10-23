import { http } from 'msw'
import type { NetworkId, Profile, Wallet, WalletType } from '@/types'
import { db, nextId } from '../db'
import {
  authenticate,
  errorResponse,
  isNetwork,
  isValidAddress,
  isWalletType,
  json,
  readJson,
  str,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'
import { syncProfileFromDefault } from '../wallet-sync'

const MAX_WALLETS = 5
const LABEL_MAX = 40

type WalletInput = { label: string; type: WalletType; network: NetworkId; address: string }

function validateWallet(body: Record<string, unknown>): { ok: true; value: WalletInput } | { ok: false; errors: Record<string, string> } {
  const type = str(body.type)
  const network = str(body.network)
  const address = str(body.address)
  const label = str(body.label)

  const errors: Record<string, string> = {}
  if (!label) errors.label = 'Campo obrigatório'
  else if (label.length > LABEL_MAX) errors.label = `Use até ${LABEL_MAX} caracteres`
  if (!isWalletType(type)) errors.type = 'Selecione uma carteira'
  if (!isNetwork(network)) errors.network = 'Selecione uma rede'
  if (!address) errors.address = 'Campo obrigatório'
  else if (isNetwork(network) && !isValidAddress(network, address)) errors.address = 'Endereço de carteira inválido'

  if (!isWalletType(type) || !isNetwork(network) || Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: { label, type, network, address } }
}

function isDuplicate(wallets: Wallet[], input: WalletInput, exceptId?: string): boolean {
  return wallets.some(
    (wallet) =>
      wallet.id !== exceptId &&
      wallet.network === input.network &&
      wallet.address.toLowerCase() === input.address.toLowerCase(),
  )
}

function list(userId: string) {
  syncProfileFromDefault(userId)
  return json({ items: db.wallets.get(userId) ?? [] })
}

export const walletHandlers = [
  http.get(
    '/api/wallets',
    withScenario('wallets.list', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)
      return json({ items: db.wallets.get(user.id) ?? [] })
    }),
  ),

  http.post(
    '/api/wallets',
    withScenario('wallets.create', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const body = await readJson(request)
      const result = validateWallet(body)
      if (!result.ok) return validationError(result.errors)

      const wallets = db.wallets.get(user.id) ?? []
      if (wallets.length >= MAX_WALLETS) {
        return errorResponse(422, 'WALLET_LIMIT', `Limite de ${MAX_WALLETS} carteiras atingido`)
      }
      if (isDuplicate(wallets, result.value)) {
        const message = 'Esta carteira já está cadastrada'
        return errorResponse(409, 'WALLET_EXISTS', message, { errors: { address: message } })
      }

      const makeDefault = body.isDefault === true || wallets.length === 0
      const wallet: Wallet = {
        id: nextId('wallet'),
        ...result.value,
        isDefault: makeDefault,
        createdAt: new Date().toISOString(),
      }
      const others = makeDefault ? wallets.map((item) => ({ ...item, isDefault: false })) : wallets
      db.wallets.set(user.id, [...others, wallet])
      return list(user.id)
    }),
  ),

  http.patch(
    '/api/wallets/:id',
    withScenario('wallets.update', async ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const wallets = db.wallets.get(user.id) ?? []
      const target = wallets.find((wallet) => wallet.id === String(params.id))
      if (!target) return errorResponse(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada')

      const result = validateWallet(await readJson(request))
      if (!result.ok) return validationError(result.errors)
      if (isDuplicate(wallets, result.value, target.id)) {
        const message = 'Esta carteira já está cadastrada'
        return errorResponse(409, 'WALLET_EXISTS', message, { errors: { address: message } })
      }

      // A delivery choice follows the wallet when its address is edited.
      const profile = db.profiles.get(user.id)
      if (profile?.useAnotherWallet && profile.secondaryWallet === target.address) {
        db.profiles.set(user.id, { ...profile, secondaryWallet: result.value.address })
      }
      db.wallets.set(
        user.id,
        wallets.map((wallet) => (wallet.id === target.id ? { ...wallet, ...result.value } : wallet)),
      )
      return list(user.id)
    }),
  ),

  http.post(
    '/api/wallets/:id/default',
    withScenario('wallets.default', ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const wallets = db.wallets.get(user.id) ?? []
      if (!wallets.some((w) => w.id === String(params.id))) {
        return errorResponse(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada')
      }
      db.wallets.set(
        user.id,
        wallets.map((w) => ({ ...w, isDefault: w.id === String(params.id) })),
      )
      return list(user.id)
    }),
  ),

  http.delete(
    '/api/wallets/:id',
    withScenario('wallets.delete', ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const wallets = db.wallets.get(user.id) ?? []
      const target = wallets.find((w) => w.id === String(params.id))
      if (!target) return errorResponse(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada')

      const remaining = wallets.filter((w) => w.id !== target.id)
      if (target.isDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true }
      }
      db.wallets.set(user.id, remaining)
      return list(user.id)
    }),
  ),

  http.put(
    '/api/profile/delivery',
    withScenario('profile.delivery', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const body = await readJson(request)
      const walletId = body.walletId === null ? null : str(body.walletId)
      const profile = db.profiles.get(user.id)
      if (!profile) return errorResponse(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado')

      let next: Profile
      if (!walletId) {
        next = { ...profile, useAnotherWallet: false, secondaryWallet: '' }
      } else {
        const wallet = (db.wallets.get(user.id) ?? []).find((item) => item.id === walletId && !item.isDefault)
        if (!wallet) return errorResponse(404, 'WALLET_NOT_FOUND', 'Carteira secundária não encontrada')
        next = { ...profile, useAnotherWallet: true, secondaryWallet: wallet.address }
      }
      db.profiles.set(user.id, next)
      return json({ ...next })
    }),
  ),
]
