import { http } from 'msw'
import { EDITION_IDS } from '@/types'
import type { EditionId, NftEdition } from '@/types'
import { MAX_PER_LINE, cartOwner, getCart, type CartOwner } from '../carts'
import { cartKey, defaultEdition, findEdition, findNft, parseCartKey } from '../db'
import { buildCart, checkCoupon } from '../domain'
import { errorResponse, json, readJson, str, validationError, withScenario } from '../utils'

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

function missingOwner() {
  return errorResponse(400, 'MISSING_CART_ID', 'Envie o header X-Cart-Id para usar o carrinho como visitante')
}

const respond = (owner: CartOwner, status = 200) => json({ ...buildCart(owner) }, status)

export const cartHandlers = [
  http.get(
    '/api/cart',
    withScenario('cart.get', ({ request }) => {
      const owner = cartOwner(request)
      // A visitor that never added anything simply has an empty cart.
      return respond(owner ?? { key: 'guest:none' })
    }),
  ),

  http.post(
    '/api/cart/items',
    withScenario('cart.add', async ({ request }) => {
      const owner = cartOwner(request)
      if (!owner) return missingOwner()

      const body = await readJson(request)
      const nftId = str(body.nftId)
      // Quick add from a catalog card sends no edition: the default one is used.
      const editionId = body.editionId === undefined ? null : parseEditionId(body.editionId)
      const quantity = parseQuantity(body.quantity, 1)

      const errors: Record<string, string> = {}
      if (!nftId) errors.nftId = 'Informe o NFT'
      if (body.editionId !== undefined && !editionId) errors.editionId = 'Selecione uma edição'
      if (quantity === null) errors.quantity = 'Quantidade inválida'
      if (quantity === null || Object.keys(errors).length > 0) return validationError(errors)

      const nft = findNft(nftId)
      if (!nft) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
      const edition = editionId ? findEdition(nft, editionId) : defaultEdition(nft)
      if (!edition) {
        return editionId
          ? errorResponse(404, 'EDITION_NOT_FOUND', 'Edição não encontrada')
          : errorResponse(409, 'INSUFFICIENT_SUPPLY', `${nft.name} está esgotado`, { available: 0 })
      }

      const cart = getCart(owner.key)
      const key = cartKey(nft.id, edition.id)
      const next = (cart.lines.get(key) ?? 0) + quantity
      if (next > edition.available || next > MAX_PER_LINE) return insufficientSupply(edition)

      cart.lines.set(key, next)
      return respond(owner, 201)
    }),
  ),

  http.patch(
    '/api/cart/items/:lineId',
    withScenario('cart.update', async ({ request, params }) => {
      const owner = cartOwner(request)
      if (!owner) return missingOwner()
      const cart = getCart(owner.key)
      const key = String(params.lineId)
      const parsed = parseCartKey(key)
      if (!parsed || !cart.lines.has(key)) {
        return errorResponse(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho')
      }

      const body = await readJson(request)
      const quantity = parseQuantity(body.quantity)
      if (quantity === null) return validationError({ quantity: 'Quantidade inválida' })

      const nft = findNft(parsed.nftId)
      const edition = nft && findEdition(nft, parsed.editionId)
      if (edition && quantity > edition.available) return insufficientSupply(edition)

      cart.lines.set(key, quantity)
      return respond(owner)
    }),
  ),

  http.put(
    '/api/cart/coupon',
    withScenario('cart.coupon.apply', async ({ request }) => {
      const owner = cartOwner(request)
      if (!owner) return missingOwner()
      const body = await readJson(request)
      const code = str(body.code)
      if (!code) return validationError({ code: 'Informe o código promocional' })
      const cart = getCart(owner.key)
      if (cart.lines.size === 0) return errorResponse(422, 'EMPTY_CART', 'Seu carrinho está vazio')

      const check = checkCoupon(code)
      if (!check.ok) return errorResponse(422, check.code, check.message, { errors: { code: check.message } })

      cart.coupon = check.coupon.code
      return respond(owner)
    }),
  ),

  http.delete(
    '/api/cart/coupon',
    withScenario('cart.coupon.remove', ({ request }) => {
      const owner = cartOwner(request)
      if (!owner) return missingOwner()
      getCart(owner.key).coupon = null
      return respond(owner)
    }),
  ),

  http.delete(
    '/api/cart/items/:lineId',
    withScenario('cart.remove', ({ request, params }) => {
      const owner = cartOwner(request)
      if (!owner) return missingOwner()
      if (!getCart(owner.key).lines.delete(String(params.lineId))) {
        return errorResponse(404, 'CART_ITEM_NOT_FOUND', 'Item não está no carrinho')
      }
      return respond(owner)
    }),
  ),
]
