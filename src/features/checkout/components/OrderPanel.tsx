import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Controller, useFormContext } from 'react-hook-form'
import { RadioGroup } from 'radix-ui'
import { cn } from 'cn'

import { NftImage } from '@/components/common/NftImage'
import { Hairline } from '@/components/common/Hairline'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'
import { formatEthLabel, shortAddress } from '@/lib/format'
import type { Cart, WalletSession, WalletType } from '@/types'
import type { CheckoutForm } from '../schema'
import dividerLines from '@/assets/checkout/divider-lines.svg'
import dividerTotal from '@/assets/checkout/divider-total.svg'

const WALLET_OPTIONS: { id: WalletType; label: ReactNode; name: string }[] = [
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    label: (
      <span className="flex h-[26px] w-[224px] items-center justify-center rounded-[6px] border border-border-soft bg-surface-dark py-[8px] pl-[8px] text-[9px] leading-[normal] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
        <span aria-hidden>{'METAMASK  •  WALLETCONNECT  •  COINBASE'}</span>
        <span className="sr-only">WalletConnect: MetaMask, WalletConnect ou Coinbase</span>
      </span>
    ),
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    label: <span className="text-[15px] leading-[normal] text-foreground">MetaMask</span>,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    label: <span className="text-[15px] leading-[normal] text-foreground">Coinbase Wallet</span>,
  },
]

function OrderLines({ cart, loading }: { cart: Cart | undefined; loading: boolean }) {
  if (loading) {
    return (
      <ul aria-busy="true" aria-label="Carregando itens" className="flex w-full flex-col gap-[12px]">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-[70px] w-full rounded-none" />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="flex w-full flex-col items-start gap-[12px]">
      {cart?.items.map((line) => (
        <li key={line.id} className="flex h-[70px] w-full items-center gap-[8px] bg-surface-card pr-[16px] pl-[4px]">
          <NftImage
            alt=""
            src={line.nft.image}
            sizes="70px"
            width={70}
            height={70}
            className="size-[70px] max-w-none shrink-0 rounded-[8px] object-cover"
          />
          <span className="flex min-w-px flex-1 flex-col items-start gap-[6px] leading-[16px]">
            <span className="w-full text-[16px] font-bold text-foreground">{line.nft.name}</span>
            <span className="w-full text-[14px] text-secondary">
              Token {line.nft.tokenId} · {line.edition.label}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-[16px] text-right leading-[16px] whitespace-nowrap">
            <span className="text-[14px] text-text-secondary">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </span>
            <span className="text-[18px] font-bold text-text-accent">{formatEthLabel(line.lineTotal)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Amount({ loading, children, className }: { loading: boolean; children: ReactNode; className?: string }) {
  return loading ? (
    <Skeleton className="h-[16px] w-[96px]" />
  ) : (
    <span className={cn('block', className)}>{children}</span>
  )
}

export function OrderPanel({
  cart,
  loading,
  session,
  busyLabel,
  walletError,
  onDisconnect,
}: {
  cart: Cart | undefined
  loading: boolean
  session: WalletSession | null
  busyLabel: string | null
  walletError: string | null
  onDisconnect: () => void
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<CheckoutForm>()
  const empty = !loading && (cart?.items.length ?? 0) === 0

  return (
    <section aria-labelledby="order-heading" className="flex w-[405px] shrink-0 flex-col items-start gap-[12px]">
      <h2 id="order-heading" className="w-full text-[17px] leading-[16px] font-bold text-foreground">
        Seus NFTs
      </h2>
      <div className="flex w-full flex-col items-start gap-[12px]">
        <div className="flex w-full flex-col items-start gap-[12px]">
          <div
            aria-hidden
            className="flex w-full items-center justify-between text-[16px] leading-[16px] whitespace-nowrap text-foreground"
          >
            <span className="font-bold">NFTs</span>
            <span className="font-medium">Subtotal</span>
          </div>
          <Hairline src={dividerLines} />
        </div>

        {empty ? (
          <p className="flex h-[70px] w-full items-center gap-[12px] bg-surface-card px-[16px] text-[14px] leading-[24px] text-text-secondary">
            Seu carrinho está vazio.
            <Link to="/" hash="mercado" className="font-bold text-text-accent underline">
              Explorar o mercado
            </Link>
          </p>
        ) : (
          <OrderLines cart={cart} loading={loading} />
        )}

        <div aria-live="polite" className="flex w-full flex-col items-center gap-[12px]">
          <p className="min-w-full text-center text-[14px] leading-[16px] text-foreground">
            {cart?.coupon ? (
              <>
                Código {cart.coupon.code} aplicado ({cart.coupon.percent}%)
              </>
            ) : (
              <>
                Tem um código promocional?{' '}
                <Link to="/cart" className="underline decoration-from-font underline-offset-2">
                  Aplique aqui
                </Link>
              </>
            )}
          </p>
          <div className="flex w-full items-center justify-between whitespace-nowrap text-foreground">
            <span className="text-[15px] leading-[normal]">Subtotal</span>
            <span>
              <Amount loading={loading} className="text-right text-[18px] leading-[16px]">
                {formatEthLabel(cart?.subtotal ?? '0')}
              </Amount>
            </span>
          </div>
          <div className="flex w-full items-center justify-between text-[15px] leading-[normal] whitespace-nowrap text-foreground">
            <span>Desconto do lançamento</span>
            <span>
              <Amount loading={loading}>(-) {formatEth(cart?.discount ?? '0')}</Amount>
            </span>
          </div>
          <div className="flex w-full items-center justify-between whitespace-nowrap text-foreground">
            <span className="text-[15px] leading-[normal]">Taxa de rede</span>
            <span>
              <Amount loading={loading} className="text-right text-[18px] leading-[16px]">
                {formatEthLabel(cart?.networkFee ?? '0')}
              </Amount>
            </span>
          </div>
          <p className="min-w-full text-center text-[12px] leading-[16px] text-text-accent">Taxa estimada</p>
          <Hairline src={dividerTotal} />
          <div className="flex w-[321px] items-center justify-between leading-[16px] font-bold whitespace-nowrap">
            <span className="text-[16px] text-foreground">Total</span>
            <span>
              <Amount loading={loading} className="text-right text-[18px] text-text-accent">
                {formatEthLabel(cart?.total ?? '0')}
              </Amount>
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-[20px]">
          <h3 id="wallet-heading" className="w-full text-center text-[17px] leading-[16px] font-bold text-foreground">
            Carteira e rede
          </h3>
          <div className="flex w-full flex-col items-start gap-[24px]">
            <Controller
              control={control}
              name="walletType"
              render={({ field }) => (
                <RadioGroup.Root
                  aria-labelledby="wallet-heading"
                  aria-describedby={errors.walletType ? 'walletType-error' : undefined}
                  value={field.value || undefined}
                  onValueChange={(next) => {
                    const option = WALLET_OPTIONS.find((item) => item.id === next)
                    if (option) field.onChange(option.id)
                  }}
                  className="flex w-full flex-col items-start gap-[16px]"
                >
                  {WALLET_OPTIONS.map((option) => (
                    <RadioGroup.Item
                      key={option.id}
                      value={option.id}
                      aria-label={option.name}
                      className="group flex h-[45px] w-full items-center gap-[10px] rounded-[3px] border border-border pl-[12px] text-left data-[state=checked]:border-primary"
                    >
                      <span
                        aria-hidden
                        className="relative size-[16px] shrink-0 rounded-full border-[1.2px] border-primary group-data-[state=checked]:after:absolute group-data-[state=checked]:after:inset-[1.8px] group-data-[state=checked]:after:rounded-full group-data-[state=checked]:after:bg-primary"
                      />
                      {option.label}
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              )}
            />

            {(session || walletError) && (
              <p
                role={walletError ? 'alert' : 'status'}
                className={cn(
                  '-mt-[8px] w-full text-[12px] leading-[16px]',
                  walletError ? 'text-destructive' : 'text-text-secondary',
                )}
              >
                {walletError ?? (
                  <>
                    Carteira conectada: {shortAddress(session?.address ?? '')}.{' '}
                    <button type="button" onClick={onDisconnect} className="font-bold text-text-accent underline">
                      Desconectar
                    </button>
                  </>
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || empty || Boolean(busyLabel)}
              aria-busy={Boolean(busyLabel)}
              className="flex h-[45px] w-full items-center justify-center rounded-[8px] bg-primary px-[16px] py-[12px] text-center text-[15px] leading-[16px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyLabel ?? 'Confirmar compra'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
