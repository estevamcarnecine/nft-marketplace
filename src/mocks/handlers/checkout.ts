import { HttpResponse, http } from 'msw'
import type { Order } from '@/types'
import {
  adjustNftPrice,
  db,
  nextId,
  toNftUpdated,
} from '../db'
import { buildCart, checkCoupon, createQuote, quoteFingerprint, scheduleOrderProgress } from '../domain'
import { validateCollector } from '../validation'
import { scenario } from '../scenario'
import { broadcast } from '../socket'
import {
  authenticate,
  errorResponse,
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
      const promo = str(body.promoCode).toUpperCase() || db.cartCoupon || ''
      if (promo) {
        const check = checkCoupon(promo)
        if (!check.ok) {
          return errorResponse(422, check.code, check.message, { errors: { promoCode: check.message } })
        }
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

      const body = await readJson(request)
      const fingerprint = JSON.stringify([str(body.quoteId), str(body.walletSessionId), body.collector ?? null])
      const attempt = db.idempotency.get(`${user.id}:${key}`)
      if (attempt) {
        // Same attempt (e.g. a retry after a timeout): return the order it already created.
        if (attempt.fingerprint !== fingerprint) {
          return errorResponse(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Esta tentativa de compra já foi usada com outros dados. Revise e confirme novamente.',
          )
        }
        const existing = db.orders.find((entry) => entry.order.id === attempt.orderId)
        if (existing) {
          return HttpResponse.json(existing.order, { status: 200, headers: { 'Idempotent-Replayed': 'true' } })
        }
      }

      const quoteId = str(body.quoteId)
      const walletSessionId = str(body.walletSessionId)
      const collector = validateCollector(body.collector)
      const errors: Record<string, string> = collector.ok ? {} : { ...collector.errors }
      if (!quoteId) errors.quoteId = 'Informe a cotação'
      if (!walletSessionId) errors.walletSessionId = 'Conecte uma carteira'
      if (!collector.ok || Object.keys(errors).length > 0) return validationError(errors)
      const data = collector.value

      const session = db.walletSessions.get(walletSessionId)
      if (!session || session.userId !== user.id) {
        return errorResponse(409, 'WALLET_DISCONNECTED', 'Sua carteira foi desconectada. Conecte-a novamente.')
      }
      if (
        session.type !== data.walletType ||
        session.network !== data.network ||
        session.address.toLowerCase() !== data.walletAddress.toLowerCase()
      ) {
        return errorResponse(409, 'WALLET_MISMATCH', 'A carteira conectada não corresponde aos dados informados.')
      }

      const stored = db.quotes.get(quoteId)
      if (!stored || stored.userId !== user.id) {
        return errorResponse(404, 'QUOTE_NOT_FOUND', 'Cotação não encontrada')
      }
      if (db.cart.size === 0) {
        return errorResponse(422, 'EMPTY_CART', 'Seu carrinho está vazio')
      }

      if (scenario.priceChangeOnNextOrder) {
        scenario.priceChangeOnNextOrder = false
        for (const line of buildCart().items) {
          const updated = adjustNftPrice(line.nft.id, 5)
          if (updated) broadcast('nft.updated', toNftUpdated(updated))
        }
      }

      for (const line of buildCart().items) {
        if (line.quantity > line.edition.available) {
          return errorResponse(
            409,
            'INSUFFICIENT_SUPPLY',
            line.edition.available === 0
              ? `A edição ${line.edition.label} de ${line.nft.name} esgotou.`
              : `Restam apenas ${line.edition.available} unidades de ${line.nft.name} (edição ${line.edition.label}).`,
            { available: line.edition.available },
          )
        }
      }

      // Revalidate price, availability, coupon and fees: any difference needs a new confirmation.
      const fresh = createQuote(user.id, stored.quote.promoCode)
      const expired = new Date(stored.quote.expiresAt).getTime() < Date.now()
      if (expired || quoteFingerprint(fresh) !== quoteFingerprint(stored.quote)) {
        return errorResponse(
          409,
          'QUOTE_CHANGED',
          expired
            ? 'A cotação expirou. Revise os valores atualizados e confirme novamente.'
            : 'Os valores do pedido mudaram. Revise e confirme novamente.',
          { quote: fresh },
        )
      }

      const now = new Date().toISOString()
      const order: Order = {
        id: nextId('order'),
        status: 'pending',
        quoteId: stored.quote.id,
        lines: stored.quote.lines,
        subtotal: stored.quote.subtotal,
        discount: stored.quote.discount,
        networkFee: stored.quote.networkFee,
        total: stored.quote.total,
        wallet: { network: data.network, type: data.walletType, address: data.walletAddress },
        recipient: data.useAnotherWallet ? data.secondaryWallet : data.walletAddress,
        email: data.email,
        note: data.note,
        txHash: null,
        explorerUrl: null,
        rejectionReason: null,
        createdAt: now,
        updatedAt: now,
      }

      db.orders.unshift({ userId: user.id, order })
      db.idempotency.set(`${user.id}:${key}`, { fingerprint, orderId: order.id })
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