import { http } from 'msw'
import { db, findNft } from '../db'
import { buildCart } from '../domain'
import {
  authenticate,
  errorResponse,
  json,
  readJson,
  str,
  validationError,
  withScenario,
} from '../utils'

const MAX_PER_LINE = 99

function parseQuantity(value: unknown, fallback?: number): number | null {
  const quantity = value === undefined ? fallback : value
  return typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_PER_LINE
    ? quantity
    : null
}

export const cartHandlers = [
  http.get(
    '/api/cart',
    withScenario('cart.get', ({ request }) => {
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),

  http.post(
    '/api/cart/items',
    withScenario('cart.add', async ({ request }) => {
      const body = await readJson(request)
      const nftId = str(body.nftId)
      const quantity = parseQuantity(body.quantity, 1)

      if (!nftId) return validationError({ nftId: 'Informe o NFT' })
      if (quantity === null) return validationError({ quantity: 'Quantidade inválida' })

      const nft = findNft(nftId)
      if (!nft) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado')

      const next = (db.cart.get(nftId) ?? 0) + quantity
      if (next > nft.available) {
        return errorResponse(
          409,
          'INSUFFICIENT_SUPPLY',
          `Apenas ${nft.available} unidades disponíveis`,
          { available: nft.available },
        )
      }

      db.cart.set(nftId, next)
      return json({ ...buildCart(authenticate(request)?.id) }, 201)
    }),
  ),

  http.patch(
    '/api/cart/items/:nftId',
    withScenario('cart.update', async ({ request, params }) => {
      const nftId = String(params.nftId)
      if (!db.cart.has(nftId)) {
        return errorResponse(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho')
      }

      const body = await readJson(request)
      const quantity = parseQuantity(body.quantity)
      if (quantity === null) return validationError({ quantity: 'Quantidade inválida' })

      const nft = findNft(nftId)
      if (nft && quantity > nft.available) {
        return errorResponse(
          409,
          'INSUFFICIENT_SUPPLY',
          `Apenas ${nft.available} unidades disponíveis`,
          { available: nft.available },
        )
      }

      db.cart.set(nftId, quantity)
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),

  http.delete(
    '/api/cart/items/:nftId',
    withScenario('cart.remove', ({ request, params }) => {
      const nftId = String(params.nftId)
      if (!db.cart.delete(nftId)) {
        return errorResponse(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho')
      }
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),
]