import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { isApiError } from '@/lib/api'
import type { Cart, CartLine } from '@/types'
import { useApplyCoupon, useRemoveCartLine, useRemoveCoupon, useUpdateCartLine } from './api'
import { isLineUnavailable } from './availability'

const MAX_PER_LINE = 99

export function useCartLineActions(line: CartLine) {
  const update = useUpdateCartLine()
  const remove = useRemoveCartLine()

  function changeQuantity(quantity: number) {
    update.mutate(
      { lineId: line.id, quantity },
      { onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível alterar a quantidade.') },
    )
  }

  function removeLine() {
    remove.mutate(line.id, {
      onSuccess: () => toast.success(`${line.nft.name} removido do carrinho.`),
      onError: () => toast.error('Não foi possível remover o item. Tente novamente.'),
    })
  }

  return {
    changeQuantity,
    removeLine,
    busy: update.isPending || remove.isPending,
    unavailable: isLineUnavailable(line),
    max: Math.min(line.edition.available, MAX_PER_LINE),
  }
}

export function useCouponForm(cart: Cart | undefined) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const applied = cart?.coupon

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (applied) {
      remove.mutate(undefined, {
        onSuccess: () => toast.success(`Código ${applied.code} removido.`),
        onError: () => toast.error('Não foi possível remover o código. Tente novamente.'),
      })
      return
    }
    const trimmed = code.trim()
    if (!trimmed) return setError('Informe o código promocional')
    setError(null)
    apply.mutate(trimmed, {
      onSuccess: (next) => {
        setCode('')
        toast.success(`Código ${next.coupon?.code ?? trimmed.toUpperCase()} aplicado.`)
      },
      onError: (failure) =>
        setError(isApiError(failure) ? failure.message : 'Não foi possível aplicar o código. Tente novamente.'),
    })
  }

  return {
    applied,
    value: applied ? applied.code : code,
    change: (next: string) => {
      setCode(next)
      setError(null)
    },
    error,
    submit,
    pending: apply.isPending || remove.isPending,
  }
}
