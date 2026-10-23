import { HttpResponse, http } from 'msw'
import type { Order } from '@/types'
import {
  adjustNftPrice,
  db,
  findEdition,
  findNft,
  nextId,
  syncAvailability,
  toNftUpdated,
} from '../db'
import { PROMO_CODES, buildCart, createQuote, scheduleOrderProgress } from '../domain'
import { scenario } from '../scenario'
import { broadcast } from '../socket'
import {
  authenticate,
  errorResponse,
  isEmail,
  isNetwork,
  isRecord,
  isValidAddress,
  isWalletType,
  json,
  readJson,
  str,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'

export const checkoutHandlers = [
  http.post(
    '/api/quotes',
    withScenario('quote.create', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const body = await readJson(request)
      const promo = str(body.promoCode).toUpperCase()
      if (promo && !Object.hasOwn(PROMO_CODES, promo)) {
        return validationError({ promoCode: 'Código promocional inválido' })
      }
      if (db.cart.size === 0) {
        return errorResponse(422, 'EMPTY_CART', 'Seu carrinho está vazio')
      }

      return json({ ...createQuote(user.id, promo || null) }, 201)
    }),
  ),

  http.post(
    '/api/orders',
    withScenario('orders.create', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const key = request.headers.get('idempotency-key')
      if (!key) {
        return errorResponse(400, 'MISSING_IDEMPOTENCY_KEY', 'Envie o header Idempotency-Key')
      }

      const replay = db.idempotency.get(`${user.id}:${key}`)
      if (replay) {
        return HttpResponse.json(replay, {
          status: 200,
          headers: { 'Idempotent-Replayed': 'true' },
        })
      }

      const body = await readJson(request)
      const wallet = isRecord(body.wallet) ? body.wallet : {}
      const network = str(wallet.network)
      const walletType = str(wallet.type)
      const address = str(wallet.address)
      const email = str(body.email).toLowerCase()
      const note = str(body.note)
      const quoteId = str(body.quoteId)

      const errors: Record<string, string> = {}
      if (!quoteId) errors.quoteId = 'Informe a cotação'
      if (!isNetwork(network)) errors['wallet.network'] = 'Selecione uma rede'
      if (!isWalletType(walletType)) errors['wallet.type'] = 'Selecione uma carteira'
      if (!address) errors['wallet.address'] = 'Campo obrigatório'
      else if (isNetwork(network) && !isValidAddress(network, address)) {
        errors['wallet.address'] = 'Endereço de carteira inválido'
      }
      if (!isEmail(email)) errors.email = 'Informe um e-mail válido'
      if (note.length > 500) errors.note = 'Use até 500 caracteres'

      if (!isNetwork(network) || !isWalletType(walletType) || Object.keys(errors).length > 0) {
        return validationError(errors)
      }

      const stored = db.quotes.get(quoteId)
      if (!stored || stored.userId !== user.id) {
        return errorResponse(404, 'QUOTE_NOT_FOUND', 'Cotação não encontrada')
      }
      if (db.cart.size === 0) {
        return errorResponse(422, 'EMPTY_CART', 'Seu carrinho está vazio')
      }
      if (new Date(stored.quote.expiresAt).getTime() < Date.now()) {
        return errorResponse(409, 'QUOTE_EXPIRED', 'A cotação expirou', {
          quote: createQuote(user.id, stored.quote.promoCode),
        })
      }

      if (scenario.priceChangeOnNextOrder) {
        scenario.priceChangeOnNextOrder = false
        for (const line of buildCart().items) {
          const updated = adjustNftPrice(line.nft.id, 5)
          if (updated) broadcast('nft.updated', toNftUpdated(updated))
        }
      }

      const fresh = createQuote(user.id, stored.quote.promoCode)
      if (fresh.total !== stored.quote.total) {
        return errorResponse(409, 'PRICE_CHANGED', 'O preço mudou. Revise o total antes de confirmar.', {
          quote: fresh,
        })
      }

      for (const line of fresh.lines) {
        const nft = findNft(line.nftId)
        const edition = nft && findEdition(nft, line.editionId)
        if (nft && edition && line.quantity > edition.available) {
          return errorResponse(
            409,
            'INSUFFICIENT_SUPPLY',
            `${nft.name} (edição ${edition.label}) ficou sem estoque`,
            { available: edition.available },
          )
        }
      }

      const now = new Date().toISOString()
      const order: Order = {
        id: nextId('order'),
        status: 'pending',
        lines: fresh.lines,
        subtotal: fresh.subtotal,
        discount: fresh.discount,
        networkFee: fresh.networkFee,
        total: fresh.total,
        wallet: { network, type: walletType, address },
        email,
        note,
        createdAt: now,
        updatedAt: now,
      }

      db.orders.unshift({ userId: user.id, order })
      db.idempotency.set(`${user.id}:${key}`, order)

      for (const line of fresh.lines) {
        const nft = findNft(line.nftId)
        const edition = nft && findEdition(nft, line.editionId)
        if (!nft || !edition) continue
        edition.available -= line.quantity
        syncAvailability(nft)
        broadcast('nft.updated', toNftUpdated(nft))
      }
      db.cart.clear()
      scheduleOrderProgress(order.id)

      return json({ ...order }, 201)
    }),
  ),

  http.get(
    '/api/orders',
    withScenario('orders.list', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()
      const orders = db.orders.filter((entry) => entry.userId === user.id).map((entry) => entry.order)
      return json({ items: orders })
    }),
  ),

  http.get(
    '/api/orders/:id',
    withScenario('orders.get', ({ request, params }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()
      const found = db.orders.find(
        (entry) => entry.userId === user.id && entry.order.id === String(params.id),
      )
      if (!found) return errorResponse(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado')
      return json({ ...found.order })
    }),
  ),
]