import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { cartKey, cartQuery } from '@/features/cart/api'
import { onNftUpdated } from '@/features/realtime/apply'
import { isApiError, type ApiError } from '@/lib/api'
import type { Quote, WalletSession } from '@/types'
import { profileQuery, useConnectWallet, useCreateOrder, useCreateQuote, useDisconnectWallet } from './api'
import { EMPTY_CHECKOUT, checkoutSchema, profileToForm, toCollector, type CheckoutForm } from './schema'

const DRAFT_KEY = 'kurio.checkout.draft'

function readDraft(): CheckoutForm | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const result = checkoutSchema.safeParse(parsed)
    return result.success ? result.data : { ...EMPTY_CHECKOUT, ...(parsed as Partial<CheckoutForm>) }
  } catch {
    return null
  }
}

function writeDraft(values: CheckoutForm | null): void {
  try {
    if (values) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    else sessionStorage.removeItem(DRAFT_KEY)
  } catch {}
}

const FORM_FIELDS = new Set<string>(Object.keys(EMPTY_CHECKOUT))

export function useCheckoutFlow() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profile = useQuery(profileQuery)
  const cart = useQuery(cartQuery)
  const form = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema), defaultValues: EMPTY_CHECKOUT })

  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const createQuote = useCreateQuote()
  const createOrder = useCreateOrder()

  const [session, setSession] = useState<WalletSession | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [changedNotice, setChangedNotice] = useState<string | null>(null)
  const [staleNotice, setStaleNotice] = useState<string | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current || !profile.data) return
    hydrated.current = true
    form.reset(readDraft() ?? profileToForm(profile.data))
  }, [profile.data, form])

  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        if (hydrated.current) writeDraft(values)
      },
    })
  }, [form])

  useEffect(() => {
    if (!quote) return
    return onNftUpdated((event) => {
      const line = quote.lines.find((item) => item.nftId === event.resource.id)
      if (!line) return
      const available = event.data.editions.find((edition) => edition.id === line.editionId)?.available
      if (line.unitPrice !== event.data.price) {
        setStaleNotice(`O preço de ${line.name} mudou enquanto você revisava. Atualize os valores antes de confirmar.`)
      } else if (available !== undefined && available < line.quantity) {
        setStaleNotice(
          `A disponibilidade de ${line.name} (edição ${line.editionLabel}) mudou. Atualize os valores antes de confirmar.`,
        )
      }
    })
  }, [quote])

  function handleAuthError(error: ApiError) {
    return error.status === 401
  }

  function applyFieldErrors(error: ApiError) {
    const fields = Object.entries(error.errors ?? {}).filter(([field]) => FORM_FIELDS.has(field))
    for (const [field, message] of fields) {
      form.setError(field as FieldPath<CheckoutForm>, { type: 'server', message })
    }
    if (fields[0]) form.setFocus(fields[0][0] as FieldPath<CheckoutForm>)
    return fields.length > 0
  }

  async function handleDisconnect() {
    if (!session) return
    const current = session
    setSession(null)
    try {
      await disconnect.mutateAsync(current.id)
      toast.success('Carteira desconectada.')
    } catch {}
  }

  async function handleSubmit(values: CheckoutForm) {
    const collector = toCollector(values)
    if (!collector) return
    setWalletError(null)

    let active = session
    const matches =
      active &&
      active.type === collector.walletType &&
      active.network === collector.network &&
      active.address.toLowerCase() === collector.walletAddress.toLowerCase()

    try {
      if (!matches) {
        if (active) void disconnect.mutateAsync(active.id).catch(() => undefined)
        active = await connect.mutateAsync({
          type: collector.walletType,
          network: collector.network,
          address: collector.walletAddress,
        })
        setSession(active)
      }
    } catch (error) {
      setSession(null)
      if (isApiError(error) && (handleAuthError(error) || applyFieldErrors(error))) return
      setWalletError(
        isApiError(error) && error.code === 'WALLET_REJECTED'
          ? 'A conexão foi recusada na sua carteira. Aprove a solicitação e tente novamente.'
          : 'Não foi possível conectar a carteira. Tente novamente.',
      )
      return
    }

    try {
      setQuote(await createQuote.mutateAsync())
      setChangedNotice(null)
      setStaleNotice(null)
      setReviewOpen(true)
    } catch (error) {
      if (isApiError(error) && handleAuthError(error)) return
      toast.error(isApiError(error) ? error.message : 'Não foi possível calcular o pedido. Tente novamente.')
    }
  }

  async function handleRequote() {
    try {
      setQuote(await createQuote.mutateAsync())
      setStaleNotice(null)
      setChangedNotice('Valores atualizados. Revise e confirme novamente.')
    } catch (error) {
      if (isApiError(error) && handleAuthError(error)) return
      setReviewOpen(false)
      toast.error(isApiError(error) ? error.message : 'Não foi possível atualizar o pedido. Tente novamente.')
      void navigate({ to: '/cart' })
    }
  }

  function handleConfirm() {
    const collector = toCollector(form.getValues())
    if (!collector || !quote || !session || staleNotice) return

    createOrder.mutate(
      { quoteId: quote.id, walletSessionId: session.id, collector },
      {
        onSuccess: (order) => {
          writeDraft(null)
          setReviewOpen(false)
          void queryClient.invalidateQueries({ queryKey: cartKey })
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
        },
        onError: (error) => {
          if (!isApiError(error)) {
            toast.error('Não foi possível enviar o pedido. Tente novamente.')
            return
          }
          if (handleAuthError(error)) return
          switch (error.code) {
            case 'QUOTE_CHANGED':
              if (error.body.quote) setQuote(error.body.quote)
              setChangedNotice(error.message)
              void queryClient.invalidateQueries({ queryKey: cartKey })
              return
            case 'IDEMPOTENCY_CONFLICT':
              setChangedNotice(error.message)
              return
            case 'INSUFFICIENT_SUPPLY':
            case 'EMPTY_CART':
              setReviewOpen(false)
              toast.error(error.message)
              void queryClient.invalidateQueries({ queryKey: cartKey })
              void navigate({ to: '/cart' })
              return
            case 'WALLET_DISCONNECTED':
            case 'WALLET_MISMATCH':
              setReviewOpen(false)
              setSession(null)
              setWalletError(error.message)
              return
            default:
              setReviewOpen(false)
              if (!applyFieldErrors(error)) {
                toast.error(
                  error.status === 0
                    ? 'A conexão caiu antes da confirmação. Tente novamente: o mesmo pedido será recuperado.'
                    : error.message,
                )
              }
          }
        },
      },
    )
  }

  const busyLabel = connect.isPending
    ? 'Conectando carteira…'
    : createQuote.isPending
      ? 'Calculando pedido…'
      : createOrder.isPending
        ? 'Enviando pedido…'
        : null
  const values = useWatch({ control: form.control })

  return {
    form,
    profile,
    cart,
    session,
    walletError,
    busyLabel,
    submit: form.handleSubmit(handleSubmit),
    disconnect: () => void handleDisconnect(),
    review: {
      open: reviewOpen,
      quote,
      session,
      recipient: (values.useAnotherWallet ? values.secondaryWallet : values.walletAddress) ?? '',
      changedNotice,
      staleNotice,
      submitting: createOrder.isPending,
      requoting: createQuote.isPending,
      onConfirm: handleConfirm,
      onRequote: () => void handleRequote(),
      onClose: () => setReviewOpen(false),
    },
  }
}

export type CheckoutFlow = ReturnType<typeof useCheckoutFlow>
