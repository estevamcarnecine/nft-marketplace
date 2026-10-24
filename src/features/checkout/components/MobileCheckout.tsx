import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FormProvider, useFormState, useWatch } from 'react-hook-form'
import { cn } from 'cn'

import { Skeleton } from '@/components/ui/skeleton'
import { MobileBackButton } from '@/features/nft/components/MobileNftDetail'
import { walletsQuery } from '@/features/wallets/api'
import { formatEthLabel, shortAddress } from '@/lib/format'
import { NETWORKS, WALLET_TYPES, type Wallet, type WalletType } from '@/types'
import type { CheckoutFlow } from '../use-checkout-flow'
import { CollectorForm } from './CollectorForm'
import kebab from '@/assets/mobile/checkout/kebab.svg'
import optionCircle from '@/assets/mobile/checkout/option-circle.svg'
import radioOff from '@/assets/mobile/checkout/radio-off.svg'
import radioOn from '@/assets/mobile/checkout/radio-on.svg'
import walletIcon from '@/assets/mobile/checkout/wallet.svg'

const CONFIRM = 'linear-gradient(108.48deg, #d28a4c 3.96%, rgba(210, 138, 76, 0.8) 121.97%)'
const SECTION = 'text-[16px] leading-[16px] font-bold whitespace-nowrap text-foreground'

const OPTION_MARK: Record<WalletType, string | null> = { walletconnect: 'W', metamask: 'M', coinbase: null }
const OPTION_ORDER: WalletType[] = ['walletconnect', 'metamask', 'coinbase']
const OPTIONS = OPTION_ORDER.map((id) => WALLET_TYPES.find((type) => type.id === id)).filter((type) => type !== undefined)

function networkLabel(id: string): string {
  return NETWORKS.find((network) => network.id === id)?.label ?? id
}

export function MobileCheckout({ flow }: { flow: CheckoutFlow }) {
  const { form, profile, cart, walletError, busyLabel } = flow
  const wallets = useQuery(walletsQuery)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const { errors, submitCount } = useFormState({ control: form.control })
  const [address, network, walletType] = useWatch({ control: form.control, name: ['walletAddress', 'network', 'walletType'] })
  const hasErrors = Object.keys(errors).length > 0

  const open = detailsOpen || hasErrors
  useEffect(() => {
    if (!hasErrors) return
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }, [hasErrors, submitCount])

  function pickWallet(wallet: Wallet) {
    const options = { shouldDirty: true, shouldValidate: submitCount > 0 }
    form.setValue('walletAddress', wallet.address, options)
    form.setValue('network', wallet.network, options)
    form.setValue('walletType', wallet.type, options)
  }

  const selected = (wallet: Wallet) =>
    wallet.address.toLowerCase() === (address ?? '').toLowerCase() && wallet.network === network

  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-[28px] py-[32px]">
      <FormProvider {...form}>
        <form
          ref={formRef}
          noValidate
          onSubmit={flow.submit}
          aria-labelledby="checkout-title"
          className="flex w-full flex-1 flex-col items-start justify-between gap-[32px]"
        >
          <div className="flex w-full flex-col items-start gap-[16px]">
            <header className="relative flex h-[44px] w-full items-start gap-[24px]">
              <MobileBackButton />
              <h1 id="checkout-title" className="pt-[9px] text-[20px] leading-[16px] font-bold whitespace-nowrap text-foreground">
                Pagamento com carteira
              </h1>
            </header>

            <div className="flex w-full items-center justify-between">
              <h2 id="wallets-heading" className={SECTION}>
                Carteira conectada
              </h2>
              <Link to="/wallets" className="text-[14px] leading-[16px] font-bold whitespace-nowrap text-text-accent">
                Trocar carteira
              </Link>
            </div>

            {wallets.isPending || profile.isPending ? (
              <div aria-busy="true" aria-label="Carregando carteiras" className="flex w-full flex-col gap-[20px]">
                <Skeleton className="h-[93px] w-full rounded-[14px]" />
                <Skeleton className="h-[93px] w-full rounded-[14px]" />
              </div>
            ) : wallets.isError || profile.isError ? (
              <p role="alert" className="text-[14px] leading-[22px] text-text-secondary">
                Não foi possível carregar suas carteiras.{' '}
                <button
                  type="button"
                  onClick={() => void Promise.all([wallets.refetch(), profile.refetch()])}
                  className="font-bold text-text-accent underline"
                >
                  Tentar novamente
                </button>
              </p>
            ) : wallets.data.length === 0 ? (
              <p className="text-[14px] leading-[22px] text-text-secondary">
                Nenhuma carteira salva. Informe o endereço em “Dados do colecionador”.
              </p>
            ) : (
              <div role="radiogroup" aria-labelledby="wallets-heading" className="flex w-full flex-col gap-[20px]">
                {wallets.data.map((wallet) => {
                  const checked = selected(wallet)
                  return (
                    <div
                      key={wallet.id}
                      className={cn(
                        'relative h-[93px] w-full rounded-[14px] bg-surface-card',
                        checked && 'shadow-[0px_20px_20px_0px_rgba(10,6,4,0.45)]',
                      )}
                    >
                      <label className="absolute inset-0 flex cursor-pointer items-start rounded-[14px] pr-[44px]">
                        <input
                          type="radio"
                          name="payment-wallet"
                          checked={checked}
                          onChange={() => pickWallet(wallet)}
                          className="peer sr-only"
                        />
                        <img
                          alt=""
                          src={checked ? radioOn : radioOff}
                          className="absolute top-[39px] left-[19px] block size-[16px] rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
                        />
                        <span className="flex min-w-px flex-col items-start pt-[15px] pl-[54px]">
                          <span className="text-[16px] leading-[16px] font-bold text-foreground">{wallet.label}</span>
                          <span className="mt-[7px] text-[14px] leading-[22px] text-text-secondary">
                            {shortAddress(wallet.address)}
                            <br />
                            Rede {networkLabel(wallet.network)}
                          </span>
                        </span>
                      </label>
                      <Link
                        to="/wallets"
                        aria-label={`Gerenciar ${wallet.label}`}
                        className="absolute top-[24px] right-[5px] flex size-[44px] items-center justify-center"
                      >
                        <img alt="" src={kebab} className="block h-[15px] w-[3px] max-w-none" />
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}

            <div role="radiogroup" aria-labelledby="wallet-type-heading" className="flex w-full flex-col items-start gap-[16px]">
              <h2 id="wallet-type-heading" className={SECTION}>
                Carteira e rede
              </h2>
              {OPTIONS.map((type) => {
                const checked = walletType === type.id
                const mark = OPTION_MARK[type.id]
                return (
                  <label
                    key={type.id}
                    className="relative flex h-[65px] w-full cursor-pointer items-center rounded-[15px] bg-surface-card shadow-[0px_0px_20px_0px_rgba(10,6,4,0.45)]"
                  >
                    <input
                      type="radio"
                      name="walletType"
                      checked={checked}
                      onChange={() => form.setValue('walletType', type.id, { shouldDirty: true, shouldValidate: submitCount > 0 })}
                      className="peer sr-only"
                    />
                    <span aria-hidden className="absolute top-[13px] left-[14px] flex size-[40px] items-center justify-center">
                      <img alt="" src={optionCircle} className="absolute inset-0 block size-full max-w-none" />
                      {mark ? (
                        <span className="relative text-[14px] leading-[normal] font-bold text-text-accent">{mark}</span>
                      ) : (
                        <img alt="" src={walletIcon} className="relative block h-[18.578px] w-[20.101px] max-w-none" />
                      )}
                    </span>
                    <span className="pl-[65px] text-[14px] leading-[16px] text-foreground">{type.label}</span>
                    <img
                      alt=""
                      src={checked ? radioOn : radioOff}
                      className="absolute top-[25px] right-[17px] block size-[16px] rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
                    />
                  </label>
                )
              })}
              {errors.walletType && (
                <p role="alert" className="text-[12px] leading-[16px] text-destructive">
                  {errors.walletType.message}
                </p>
              )}
            </div>

            <details
              open={open}
              onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
              className="w-full rounded-[15px] bg-surface-card px-[16px] py-[14px]"
            >
              <summary className="cursor-pointer text-[14px] leading-[20px] font-bold text-foreground marker:text-text-accent">
                Dados do colecionador
                <span className="block text-[12px] leading-[16px] font-normal text-text-secondary">
                  {hasErrors ? 'Revise os campos destacados.' : 'Preenchidos a partir do seu perfil.'}
                </span>
              </summary>
              <fieldset disabled={profile.isPending} aria-busy={profile.isPending} className="contents">
                <div className="mt-[16px]">
                  <CollectorForm stacked />
                </div>
              </fieldset>
            </details>

            <div className="flex w-full items-start justify-end">
              <p className="flex items-center gap-[28px] leading-[16px] font-bold whitespace-nowrap">
                <span className="text-[16px] text-foreground">Total:</span>
                {cart.isPending ? (
                  <Skeleton className="h-[16px] w-[90px]" />
                ) : (
                  <span className="text-right text-[18px] text-text-accent">{formatEthLabel(cart.data?.total ?? '0')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-[12px]">
            {walletError && (
              <p role="alert" className="w-full text-center text-[13px] leading-[18px] text-destructive">
                {walletError}
              </p>
            )}
            <button
              type="submit"
              disabled={Boolean(busyLabel) || profile.isPending || !cart.data?.items.length}
              aria-busy={Boolean(busyLabel)}
              className="flex h-[60px] w-full items-center justify-center rounded-[40px] text-[15px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
              style={{ backgroundImage: CONFIRM }}
            >
              {busyLabel ?? 'Confirmar compra'}
            </button>
          </div>
        </form>
      </FormProvider>
    </main>
  )
}
