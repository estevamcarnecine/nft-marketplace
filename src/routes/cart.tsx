import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { PageShell } from '@/components/layout/PageShell'
import { cartQuery } from '@/features/cart/api'
import { CartSummary } from '@/features/cart/components/CartSummary'
import { CartTable } from '@/features/cart/components/CartTable'
import { MobileCart } from '@/features/cart/components/MobileCart'
import { RelatedNfts } from '@/features/nft/components/RelatedNfts'
import { CartNotices } from '@/features/realtime/components/CartNotices'
import { useIsDesktop } from '@/lib/use-media-query'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const cart = useQuery(cartQuery)
  const lines = cart.data?.items ?? []
  const desktop = useIsDesktop()

  if (!desktop) return <MobileCart cart={cart.data} status={cart.status} onRetry={() => void cart.refetch()} />

  return (
    <PageShell active="market">
      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip">
        <nav aria-label="Você está em" className="text-[15px] leading-[16px] font-bold whitespace-nowrap text-foreground">
          <Link to="/">Início</Link>
          {' / '}
          <Link to="/" hash="mercado">
            Mercado
          </Link>
          {' / '}
          <span aria-current="page">Carrinho</span>
        </nav>
        <h1 className="sr-only">Carrinho</h1>
        <CartNotices />
        <div className="flex w-full items-start justify-between overflow-clip">
          <CartTable lines={lines} status={cart.status} onRetry={() => void cart.refetch()} />
          <CartSummary cart={cart.data} loading={cart.isPending} />
        </div>
      </div>

      {cart.isSuccess && (
        <RelatedNfts title="Colecionadores também viram" nftId={lines[0]?.nft.id} variant="cart" />
      )}
    </PageShell>
  )
}
