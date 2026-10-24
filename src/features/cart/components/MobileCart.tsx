import { Link, useNavigate } from '@tanstack/react-router'

import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { MobileBackButton } from '@/features/nft/components/MobileNftDetail'
import { CartNotices } from '@/features/realtime/components/CartNotices'
import { formatEth } from '@/lib/eth'
import { formatEthLabel } from '@/lib/format'
import type { Cart, CartLine } from '@/types'
import { isLineUnavailable } from '../availability'
import { useCartLineActions, useCouponForm } from '../use-cart-actions'
import deleteIcon from '@/assets/mobile/cart/delete.svg'
import minusIcon from '@/assets/mobile/cart/minus.svg'
import minusDisabledIcon from '@/assets/mobile/cart/minus-disabled.svg'

const APPLY = 'linear-gradient(96.02deg, rgba(210, 138, 76, 0.54) 0.94%, #d28a4c 105.02%)'
const CHECKOUT = 'linear-gradient(108.86deg, #d28a4c 3.96%, rgba(210, 138, 76, 0.8) 121.97%)'
const CARD = 'relative h-[100px] w-full rounded-[14px] bg-surface-card shadow-[0px_6px_20px_0px_rgba(10,6,4,0.45)]'
const ROW = 'flex w-full items-start justify-between whitespace-nowrap text-foreground'
// 24px visuals inside 44px touch targets.
const HIT = 'before:absolute before:-inset-[10px] before:content-[""]'

/** Figma "Mobile / Carrinho de NFTs" Item: thumbnail, name, edition, line total and quantity. */
function MobileCartLine({ line }: { line: CartLine }) {
  const { changeQuantity, removeLine, busy, unavailable, max } = useCartLineActions(line)
  const name = `${line.nft.name} (edição ${line.edition.label})`

  return (
    <li aria-busy={busy} className={CARD} data-unavailable={unavailable || undefined}>
      <Link to="/nft/$id" params={{ id: line.nft.id }} className="absolute inset-y-0 left-0 flex w-[calc(100%-38px)] items-start">
        {/* The frame stacks the art over itself with multiply, which deepens its tones. */}
        <span className="relative size-[100px] shrink-0">
          <NftImage alt="" src={line.nft.image} sizes="100px" className="absolute inset-0 size-full rounded-l-[14px] object-cover" />
          <NftImage alt="" src={line.nft.image} sizes="100px" className="absolute inset-0 size-full rounded-[14px] object-cover mix-blend-multiply" />
        </span>
        <span className="flex min-w-px flex-1 flex-col items-start pt-[13px] pl-[9px] leading-[16px]">
          <span className="w-full truncate text-[15px] font-bold text-foreground">{line.nft.name}</span>
          {unavailable ? (
            <span className="mt-[6px] text-[14px] font-bold text-destructive">
              {line.edition.available === 0 ? 'Edição esgotada' : `Restam ${line.edition.available} unid.`}
            </span>
          ) : (
            <span className="mt-[6px] text-[14px] text-text-secondary">Edição: {line.edition.label}</span>
          )}
          <span className="mt-[18px] text-[18px] font-bold text-text-accent">
            <span className="sr-only">Total da linha: </span>
            {formatEthLabel(line.lineTotal)}
          </span>
        </span>
      </Link>

      <div role="group" aria-label={`Quantidade de ${name}`} className="absolute top-[38px] right-[16px] flex items-center">
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${line.nft.name}`}
          disabled={busy || line.quantity <= 1}
          onClick={() => changeQuantity(line.quantity - 1)}
          className={`${HIT} relative size-[24px] disabled:cursor-not-allowed`}
        >
          <img alt="" src={line.quantity <= 1 ? minusDisabledIcon : minusIcon} className="block size-[24px] max-w-none" />
        </button>
        <output aria-live="polite" className="w-[33px] text-center text-[16px] leading-[22px] text-foreground">
          {line.quantity}
        </output>
        <button
          type="button"
          aria-label={`Aumentar quantidade de ${line.nft.name}`}
          disabled={busy || line.quantity >= max}
          onClick={() => changeQuantity(line.quantity + 1)}
          className={`${HIT} relative flex size-[24px] items-center justify-center rounded-[31px] border border-border bg-surface-raised text-[21px] leading-[16px] text-foreground disabled:opacity-50`}
        >
          <span aria-hidden className="-mt-[2px]">
            +
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={removeLine}
        disabled={busy}
        aria-label={`Remover ${name} do carrinho`}
        className={`${HIT} absolute top-[8px] right-[10px] flex size-[24px] items-center justify-center disabled:opacity-50`}
      >
        <img alt="" src={deleteIcon} className="block h-[16px] w-[14.13px] max-w-none" />
      </button>
    </li>
  )
}

function Amount({ value, loading, className }: { value: string; loading: boolean; className?: string }) {
  if (loading) return <Skeleton className="h-[16px] w-[90px]" />
  return <span className={className}>{value}</span>
}

/** Figma "Payment Summary": promo code, totals from the API and the checkout button. */
function MobileCartSummary({ cart, loading }: { cart: Cart | undefined; loading: boolean }) {
  const navigate = useNavigate()
  const coupon = useCouponForm(cart)
  const empty = !cart || cart.items.length === 0
  const blocked = cart?.items.some(isLineUnavailable) ?? false

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex w-full flex-1 flex-col items-center gap-[32px] rounded-t-[40px] bg-surface-card px-[24px] pt-[24px] pb-[calc(36px+env(safe-area-inset-bottom))]"
    >
      <h2 id="summary-heading" className="sr-only">
        Resumo da carteira
      </h2>
      <div className="flex w-full flex-col items-start gap-[12px]">
        <form onSubmit={coupon.submit} noValidate className="flex w-full flex-col gap-[6px]">
          <div className="flex h-[50px] w-full items-center rounded-[40px] border border-border bg-surface-card pl-[16px] drop-shadow-[0px_6px_10px_rgba(10,6,4,0.45)]">
            <label htmlFor="promo-code" className="sr-only">
              Código promocional
            </label>
            <input
              id="promo-code"
              value={coupon.value}
              onChange={(event) => coupon.change(event.target.value)}
              readOnly={Boolean(coupon.applied)}
              disabled={loading || empty}
              placeholder="Digite o código promocional..."
              autoComplete="off"
              aria-invalid={Boolean(coupon.error)}
              aria-describedby={coupon.error ? 'promo-error' : coupon.applied ? 'promo-applied' : undefined}
              className="min-w-px flex-1 bg-transparent text-[13px] leading-[22px] text-foreground uppercase outline-none placeholder:text-secondary placeholder:normal-case read-only:text-text-accent"
            />
            <button
              type="submit"
              disabled={loading || empty || coupon.pending}
              aria-busy={coupon.pending}
              className="flex h-[50px] w-[97px] shrink-0 items-center justify-center rounded-[40px] text-[15px] leading-[16px] font-bold text-foreground disabled:opacity-60"
              style={{ backgroundImage: APPLY }}
            >
              {coupon.applied ? 'Remover' : 'Aplicar'}
            </button>
          </div>
          {coupon.error && (
            <p id="promo-error" role="alert" className="pl-[16px] text-[12px] leading-[16px] text-destructive">
              {coupon.error}
            </p>
          )}
          {coupon.applied && !coupon.error && (
            <p id="promo-applied" className="pl-[16px] text-[12px] leading-[16px] text-text-accent">
              {coupon.applied.percent}% de desconto aplicado
            </p>
          )}
        </form>

        <dl aria-live="polite" className="flex w-full flex-col gap-[12px]">
          <div className={ROW}>
            <dt className="text-[15px] leading-[normal]">Subtotal</dt>
            <dd>
              <Amount loading={loading} value={formatEthLabel(cart?.subtotal ?? '0')} className="text-[16px] leading-[16px]" />
            </dd>
          </div>
          <div className={`${ROW} text-[15px] leading-[normal]`}>
            <dt>Desconto do lançamento</dt>
            <dd>
              <Amount loading={loading} value={`(-) ${formatEth(cart?.discount ?? '0')}`} />
            </dd>
          </div>
          <div className="flex w-full flex-col items-end">
            <div className={`${ROW} items-center`}>
              <dt className="text-[15px] leading-[normal]">Taxa de rede</dt>
              <dd>
                <Amount loading={loading} value={formatEthLabel(cart?.networkFee ?? '0')} className="text-[16px] leading-[16px]" />
              </dd>
            </div>
            <p className="text-[12px] leading-[16px] text-text-accent">Taxa estimada</p>
          </div>
          <div className={`${ROW} leading-[16px] font-bold`}>
            <dt className="text-[16px]">Total</dt>
            <dd>
              <Amount loading={loading} value={formatEthLabel(cart?.total ?? '0')} className="text-[18px] text-text-accent" />
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex w-full flex-col items-center gap-[12px]">
        <button
          type="button"
          onClick={() => void navigate({ to: '/checkout' })}
          disabled={loading || empty || blocked}
          aria-describedby={blocked ? 'checkout-blocked' : undefined}
          className="flex h-[60px] w-full items-center justify-center rounded-[40px] text-[16px] leading-[16px] font-bold text-ink disabled:opacity-60"
          style={{ backgroundImage: CHECKOUT }}
        >
          Conectar e finalizar
        </button>
        {blocked && (
          <p id="checkout-blocked" className="text-center text-[12px] leading-[16px] text-destructive">
            Ajuste os itens indisponíveis para continuar.
          </p>
        )}
      </div>
    </section>
  )
}

/** Figma "Mobile / Carrinho de NFTs" (16:360). */
export function MobileCart({ cart, status, onRetry }: { cart: Cart | undefined; status: 'pending' | 'error' | 'success'; onRetry: () => void }) {
  const lines = cart?.items ?? []

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-[24px] pt-[32px]">
      <main id="conteudo" className="flex w-full flex-col items-start gap-[12px] px-[28px]">
        <header className="relative flex h-[44px] w-full items-start">
          <MobileBackButton />
          <h1 className="absolute top-[9px] left-1/2 -translate-x-1/2 text-[20px] leading-[16px] font-bold whitespace-nowrap text-foreground">
            Carrinho de NFTs
          </h1>
        </header>
        <CartNotices />
        <section aria-label="Itens do carrinho" className="w-full">
          {status === 'pending' ? (
            <ul aria-busy="true" aria-label="Carregando carrinho" className="flex w-full flex-col gap-[20px]">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-[100px] w-full rounded-[14px]" />
                </li>
              ))}
            </ul>
          ) : status === 'error' ? (
            <div role="alert" className="flex flex-col items-start gap-[8px] rounded-[14px] bg-surface-card p-[16px] text-[14px] leading-[22px] text-text-secondary">
              Não foi possível carregar seu carrinho.
              <button type="button" onClick={onRetry} className="font-bold text-text-accent underline">
                Tentar novamente
              </button>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-start gap-[8px] rounded-[14px] bg-surface-card p-[16px] text-[14px] leading-[22px] text-text-secondary">
              Seu carrinho está vazio.
              <Link to="/" hash="mercado" className="font-bold text-text-accent underline">
                Explorar o mercado
              </Link>
            </div>
          ) : (
            <ul className="flex w-full flex-col gap-[20px]">
              {lines.map((line) => (
                <MobileCartLine key={line.id} line={line} />
              ))}
            </ul>
          )}
        </section>
      </main>
      <MobileCartSummary cart={cart} loading={status === 'pending'} />
    </div>
  )
}
