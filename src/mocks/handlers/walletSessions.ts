import { HttpResponse, http } from 'msw'
import type { WalletSession } from '@/types'
import { db, nextId } from '../db'
import { scenario } from '../scenario'
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

/** Simulated wallet connection: stands in for a browser extension or WalletConnect handshake. */
export const walletSessionHandlers = [
  http.post(
    '/api/wallet-sessions',
    withScenario('wallet.connect', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)

      const body = await readJson(request)
      const type = str(body.type)
      const network = str(body.network)
      const address = str(body.address)

      const errors: Record<string, string> = {}
      if (!isWalletType(type)) errors.walletType = 'Selecione uma carteira'
      if (!isNetwork(network)) errors.network = 'Selecione uma rede'
      if (!address) errors.walletAddress = 'Campo obrigatório'
      else if (isNetwork(network) && !isValidAddress(network, address)) {
        errors.walletAddress = 'Endereço de carteira inválido'
      }
      if (!isWalletType(type) || !isNetwork(network) || Object.keys(errors).length > 0) {
        return validationError(errors)
      }

      if (scenario.walletReject) {
        return errorResponse(409, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
      }

      const session: WalletSession = {
        id: nextId('wsess'),
        type,
        network,
        address,
        connectedAt: new Date().toISOString(),
      }
      db.walletSessions.set(session.id, { ...session, userId: user.id })
      return json({ ...session }, 201)
    }),
  ),

  http.delete(
    '/api/wallet-sessions/:id',
    withScenario('wallet.disconnect', ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)
      const stored = db.walletSessions.get(String(params.id))
      if (!stored || stored.userId !== user.id) {
        return errorResponse(404, 'WALLET_SESSION_NOT_FOUND', 'Carteira não conectada')
      }
      db.walletSessions.delete(stored.id)
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
