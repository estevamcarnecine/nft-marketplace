import { Link, useNavigate } from '@tanstack/react-router'

import { Hairline } from '@/components/common/Hairline'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'
import { formatEthLabel } from '@/lib/format'
import type { Cart } from '@/types'
import { useCouponForm } from '../use-cart-actions'
import { isLineUnavailable } from '../availability'
import divider from '@/assets/cart/divider-summary.svg'

const ROW = 'flex w-full items-start justify-between whitespace-nowrap text-foreground'

function Amount({ value, loading, className }: { value: string; loading: boolean; className: string }) {
  if (loading) return <Skeleton className="h-[16px] w-[96px]" />
  return <span className={`block ${className}`}>{value}</span>
}

function CouponForm({ cart, disabled }: { cart: Cart | undefined; disabled: boolean }) {
  const coupon = useCouponForm(cart)
  const { applied, error, pending } = coupon

  return (
    <form onSubmit={coupon.submit} noValidate className="flex w-full flex-col items-start gap-[8px] overflow-clip">
      <label htmlFor="promo-code" className="text-[14px] leading-[16px] font-bold whitespace-nowrap text-foreground">
        Código promocional
      </label>
      <div className="flex h-[40px] w-[332px] items-center rounded-[3px] border border-primary pl-[8px]">
        <input
          id="promo-code"
          value={coupon.value}
          onChange={(event) => coupon.change(event.target.value)}
          readOnly={Boolean(applied)}
          disabled={disabled}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'promo-error' : applied ? 'promo-applied' : undefined}
          className="min-w-px flex-1 bg-transparent text-[12px] leading-[16px] text-foreground uppercase outline-none placeholder:text-secondary placeholder:normal-case read-only:text-text-accent"
        />
        <button
          type="submit"
          disabled={disabled || pending}
          aria-busy={pending}
          className="flex h-[40px] w-[102px] shrink-0 items-center justify-center rounded-tr-[3px] rounded-br-[3px] bg-primary text-[15px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applied ? 'Remover' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id="promo-error" role="alert" className="text-[12px] leading-[16px] text-destructive">
          {error}
        </p>
      )}
      {applied && !error && (
        <p id="promo-applied" className="text-[12px] leading-[16px] text-text-accent">
          {applied.percent}% de desconto aplicado
        </p>
      )}
    </form>
  )
}

export function CartSummary({ cart, loading }: { cart: Cart | undefined; loading: boolean }) {
  const navigate = useNavigate()
  const empty = !cart || cart.items.length === 0
  const blocked = cart?.items.some(isLineUnavailable) ?? false

  return (
    <aside aria-labelledby="summary-heading" className="flex w-[332px] shrink-0 flex-col items-start gap-[24px] overflow-clip">
      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip">
        <h2 id="summary-heading" className="text-[18px] leading-[16px] font-bold whitespace-nowrap text-foreground">
          Resumo da carteira
        </h2>
        <Hairline src={divider} />
      </div>

      <CouponForm cart={cart} disabled={loading || empty} />

      <dl aria-live="polite" className="flex w-full flex-col items-start gap-[12px] overflow-clip">
        <div className={ROW}>
          <dt className="text-[15px] leading-[normal]">Subtotal</dt>
          <dd>
            <Amount loading={loading} value={formatEthLabel(cart?.subtotal ?? '0')} className="text-right text-[18px] leading-[16px]" />
          </dd>
        </div>
        <div className={`${ROW} text-[15px] leading-[normal]`}>
          <dt>Desconto do lançamento</dt>
          <dd>
            <Amount loading={loading} value={`(-) ${formatEth(cart?.discount ?? '0')}`} className="" />
          </dd>
        </div>
        <div className="flex w-full flex-col items-end gap-[12px]">
          <div className="flex w-[332px] items-center justify-between whitespace-nowrap text-foreground">
            <dt className="text-[15px] leading-[normal]">Taxa de rede</dt>
            <dd>
              <Amount loading={loading} value={formatEthLabel(cart?.networkFee ?? '0')} className="text-right text-[18px] leading-[16px]" />
            </dd>
          </div>
          <p className="text-[12px] leading-[16px] text-text-accent">Taxa estimada</p>
        </div>
      </dl>

      <div className="flex w-full items-start justify-between overflow-clip leading-[16px] font-bold whitespace-nowrap">
        <span className="text-[16px] text-foreground">Total</span>
        <Amount
          loading={loading}
          value={formatEthLabel(cart?.total ?? '0')}
          className="text-right text-[18px] text-text-accent"
        />
      </div>

      <div className="flex w-full flex-col items-center gap-[12px] overflow-clip">
        <button
          type="button"
          onClick={() => void navigate({ to: '/checkout' })}
          disabled={loading || empty || blocked}
          aria-describedby={blocked ? 'checkout-blocked' : undefined}
          className="flex h-[40px] w-full items-center justify-center overflow-clip rounded-[3px] bg-primary text-[15px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          Conectar e finalizar
        </button>
        {blocked && (
          <p id="checkout-blocked" className="text-center text-[12px] leading-[16px] text-destructive">
            Ajuste os itens indisponíveis para continuar.
          </p>
        )}
        <Link to="/" hash="mercado" className="text-[15px] leading-[normal] whitespace-nowrap text-text-accent">
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}
