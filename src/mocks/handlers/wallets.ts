import { http } from 'msw'
import { WALLET_TYPES } from '@/types'
import type { Wallet } from '@/types'
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

const MAX_WALLETS = 5

export const walletHandlers = [
  http.get(
    '/api/wallets',
    withScenario('wallets.list', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()
      return json({ items: db.wallets.get(user.id) ?? [] })
    }),
  ),

  http.post(
    '/api/wallets',
    withScenario('wallets.create', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const body = await readJson(request)
      const type = str(body.type)
      const network = str(body.network)
      const address = str(body.address)
      const label = str(body.label)

      const errors: Record<string, string> = {}
      if (!isWalletType(type)) errors.type = 'Selecione uma carteira'
      if (!isNetwork(network)) errors.network = 'Selecione uma rede'
      if (!address) errors.address = 'Campo obrigatório'
      else if (isNetwork(network) && !isValidAddress(network, address)) {
        errors.address = 'Endereço de carteira inválido'
      }
      if (label.length > 40) errors.label = 'Use até 40 caracteres'

      if (!isWalletType(type) || !isNetwork(network) || Object.keys(errors).length > 0) {
        return validationError(errors)
      }

      const wallets = db.wallets.get(user.id) ?? []
      if (wallets.length >= MAX_WALLETS) {
        return errorResponse(422, 'WALLET_LIMIT', `Limite de ${MAX_WALLETS} carteiras atingido`)
      }
      if (wallets.some((w) => w.network === network && w.address.toLowerCase() === address.toLowerCase())) {
        return errorResponse(409, 'WALLET_EXISTS', 'Esta carteira já está cadastrada')
      }

      const typeLabel = WALLET_TYPES.find((t) => t.id === type)?.label ?? type
      const wallet: Wallet = {
        id: nextId('wallet'),
        label: label || typeLabel,
        type,
        network,
        address,
        isDefault: wallets.length === 0,
        createdAt: new Date().toISOString(),
      }
      db.wallets.set(user.id, [...wallets, wallet])
      return json({ ...wallet }, 201)
    }),
  ),

  http.post(
    '/api/wallets/:id/default',
    withScenario('wallets.default', ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const wallets = db.wallets.get(user.id) ?? []
      if (!wallets.some((w) => w.id === String(params.id))) {
        return errorResponse(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada')
      }
      const updated = wallets.map((w) => ({ ...w, isDefault: w.id === String(params.id) }))
      db.wallets.set(user.id, updated)
      return json({ items: updated })
    }),
  ),

  http.delete(
    '/api/wallets/:id',
    withScenario('wallets.delete', ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const wallets = db.wallets.get(user.id) ?? []
      const target = wallets.find((w) => w.id === String(params.id))
      if (!target) return errorResponse(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada')

      const remaining = wallets.filter((w) => w.id !== target.id)
      if (target.isDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true }
      }
      db.wallets.set(user.id, remaining)
      return json({ items: remaining })
    }),
  ),
]