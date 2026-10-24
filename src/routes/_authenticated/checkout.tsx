import { Link, createFileRoute } from '@tanstack/react-router'
import { FormProvider } from 'react-hook-form'

import { PageShell } from '@/components/layout/PageShell'
import { CollectorForm } from '@/features/checkout/components/CollectorForm'
import { MobileCheckout } from '@/features/checkout/components/MobileCheckout'
import { OrderPanel } from '@/features/checkout/components/OrderPanel'
import { ReviewDialog } from '@/features/checkout/components/ReviewDialog'
import { useCheckoutFlow, type CheckoutFlow } from '@/features/checkout/use-checkout-flow'
import { useIsDesktop } from '@/lib/use-media-query'

export const Route = createFileRoute('/_authenticated/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const flow = useCheckoutFlow()
  const desktop = useIsDesktop()
  return (
    <>
      {desktop ? <DesktopCheckout flow={flow} /> : <MobileCheckout flow={flow} />}
      <ReviewDialog {...flow.review} />
    </>
  )
}

function DesktopCheckout({ flow }: { flow: CheckoutFlow }) {
  const { form, profile, cart, session, busyLabel, walletError } = flow

  return (
    <PageShell active="market">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={flow.submit}
          aria-labelledby="checkout-title"
          className="flex w-full flex-col items-start gap-[32px]"
        >
          <nav
            aria-label="Você está em"
            className="text-[15px] leading-[16px] font-bold whitespace-nowrap text-foreground"
          >
            <Link to="/">Início</Link>
            {' / '}
            <Link to="/" hash="mercado">
              Mercado
            </Link>
            {' / '}
            <span aria-current="page">Pagamento</span>
          </nav>
          <h1 id="checkout-title" className="sr-only">
            Pagamento
          </h1>

          {profile.isError ? (
            <p role="alert" className="text-[14px] leading-[24px] text-text-secondary">
              Não foi possível carregar seus dados.{' '}
              <button
                type="button"
                onClick={() => void profile.refetch()}
                className="font-bold text-text-accent underline"
              >
                Tentar novamente
              </button>
            </p>
          ) : (
            <div className="flex w-full items-start gap-[32px]">
              <fieldset disabled={profile.isPending} aria-busy={profile.isPending} className="contents">
                <CollectorForm />
              </fieldset>
              <OrderPanel
                cart={cart.data}
                loading={cart.isPending}
                session={session}
                busyLabel={busyLabel}
                walletError={walletError}
                onDisconnect={flow.disconnect}
              />
            </div>
          )}
        </form>
      </FormProvider>
    </PageShell>
  )
}
