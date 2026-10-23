import { http } from 'msw'
import { EDITION_IDS } from '@/types'
import type { EditionId, NftEdition } from '@/types'
import { cartKey, db, findEdition, findNft, parseCartKey } from '../db'
import { buildCart, checkCoupon } from '../domain'
import {
  authenticate,
  errorResponse,
  json,
  readJson,
  str,
  validationError,
  withScenario,
} from '../utils'

export const MAX_PER_LINE = 99

function parseQuantity(value: unknown, fallback?: number): number | null {
  const quantity = value === undefined ? fallback : value
  return typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_PER_LINE
    ? quantity
    : null
}

function parseEditionId(value: unknown): EditionId | null {
  return EDITION_IDS.find((id) => id === value) ?? null
}

function insufficientSupply(edition: NftEdition) {
  return errorResponse(
    409,
    'INSUFFICIENT_SUPPLY',
    edition.available === 0
      ? `A edição ${edition.label} está esgotada`
      : `Apenas ${edition.available} unidades disponíveis na edição ${edition.label}`,
    { available: edition.available },
  )
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
      const editionId = parseEditionId(body.editionId)
      const quantity = parseQuantity(body.quantity, 1)

      const errors: Record<string, string> = {}
      if (!nftId) errors.nftId = 'Informe o NFT'
      if (!editionId) errors.editionId = 'Selecione uma edição'
      if (quantity === null) errors.quantity = 'Quantidade inválida'
      if (!editionId || quantity === null || Object.keys(errors).length > 0) {
        return validationError(errors)
      }

      const nft = findNft(nftId)
      if (!nft) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
      const edition = findEdition(nft, editionId)
      if (!edition) return errorResponse(404, 'EDITION_NOT_FOUND', 'Edição não encontrada')

      const key = cartKey(nft.id, edition.id)
      const next = (db.cart.get(key) ?? 0) + quantity
      if (next > edition.available || next > MAX_PER_LINE) return insufficientSupply(edition)

      db.cart.set(key, next)
      return json({ ...buildCart(authenticate(request)?.id) }, 201)
    }),
  ),

  http.patch(
    '/api/cart/items/:lineId',
    withScenario('cart.update', async ({ request, params }) => {
      const key = String(params.lineId)
      const parsed = parseCartKey(key)
      if (!parsed || !db.cart.has(key)) {
        return errorResponse(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho')
      }

      const body = await readJson(request)
      const quantity = parseQuantity(body.quantity)
      if (quantity === null) return validationError({ quantity: 'Quantidade inválida' })

      const nft = findNft(parsed.nftId)
      const edition = nft && findEdition(nft, parsed.editionId)
      if (edition && quantity > edition.available) return insufficientSupply(edition)

      db.cart.set(key, quantity)
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),

  http.put(
    '/api/cart/coupon',
    withScenario('cart.coupon.apply', async ({ request }) => {
      const body = await readJson(request)
      const code = str(body.code)
      if (!code) return validationError({ code: 'Informe o código promocional' })
      if (db.cart.size === 0) return errorResponse(422, 'EMPTY_CART', 'Seu carrinho está vazio')

      const check = checkCoupon(code)
      if (!check.ok) return errorResponse(422, check.code, check.message, { errors: { code: check.message } })

      db.cartCoupon = check.coupon.code
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),

  http.delete(
    '/api/cart/coupon',
    withScenario('cart.coupon.remove', ({ request }) => {
      db.cartCoupon = null
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),

  http.delete(
    '/api/cart/items/:lineId',
    withScenario('cart.remove', ({ request, params }) => {
      if (!db.cart.delete(String(params.lineId))) {
        return errorResponse(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho')
      }
      return json({ ...buildCart(authenticate(request)?.id) })
    }),
  ),
]
