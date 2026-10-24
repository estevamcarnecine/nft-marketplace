import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { PageShell } from '@/components/layout/PageShell'
import { Skeleton } from '@/components/ui/skeleton'
import { nftDetailQuery } from '@/features/nft/api'
import { NftDetailsTabs } from '@/features/nft/components/NftDetailsTabs'
import { NftGallery } from '@/features/nft/components/NftGallery'
import { NftPurchasePanel } from '@/features/nft/components/NftPurchasePanel'
import { MobileNftDetail, MobileNftDetailMessage, MobileNftDetailSkeleton } from '@/features/nft/components/MobileNftDetail'
import { RelatedNfts } from '@/features/nft/components/RelatedNfts'
import { isApiError } from '@/lib/api'
import { useIsDesktop } from '@/lib/use-media-query'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

function Breadcrumb() {
  return (
    <nav aria-label="Você está em" className="text-[15px] leading-[16px] font-bold whitespace-nowrap text-foreground">
      <Link to="/">Início</Link>
      {' / '}
      <Link to="/" hash="mercado">
        Mercado
      </Link>
    </nav>
  )
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="flex w-full items-start gap-[32px]">
      <div className="flex h-[448px] w-[573px] shrink-0 items-center gap-[28px]">
        <div className="flex w-[100px] flex-col gap-[16px]">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="size-[100px] rounded-[6px]" />
          ))}
        </div>
        <Skeleton className="size-[444px] rounded-[6px]" />
      </div>
      <div className="flex min-w-px flex-1 flex-col justify-between self-stretch">
        <div className="flex flex-col gap-[12px]">
          <Skeleton className="h-[33px] w-[320px]" />
          <Skeleton className="h-[16px] w-full" />
        </div>
        <Skeleton className="h-[94px] w-full" />
        <Skeleton className="h-[56px] w-[209px]" />
        <Skeleton className="h-[50px] w-full" />
        <Skeleton className="h-[114px] w-[308px]" />
      </div>
    </div>
  )
}

function DetailMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[448px] w-full flex-col items-start justify-center gap-[16px] rounded-[6px] bg-surface-card p-[40px]">
      <h1 className="text-[28px] leading-[normal] font-bold text-foreground">{title}</h1>
      {children}
    </div>
  )
}

function NftDetailPage() {
  const { id } = Route.useParams()
  const detail = useQuery(nftDetailQuery(id))
  const notFound = isApiError(detail.error) && detail.error.status === 404
  const desktop = useIsDesktop()

  if (!desktop) {
    return (
      <main id="conteudo" className="w-full">
        {detail.isPending ? (
          <MobileNftDetailSkeleton />
        ) : notFound ? (
          <MobileNftDetailMessage title="NFT não encontrado">
            <p className="text-[14px] leading-[22px] text-text-secondary">O NFT que você procura não existe ou foi removido do mercado.</p>
          </MobileNftDetailMessage>
        ) : detail.isError ? (
          <MobileNftDetailMessage title="Não foi possível carregar este NFT">
            <p role="alert" className="text-[14px] leading-[22px] text-text-secondary">
              {isApiError(detail.error) ? detail.error.message : 'Verifique sua conexão e tente novamente.'}
            </p>
            <button type="button" onClick={() => void detail.refetch()} className="h-[44px] rounded-[6px] bg-primary px-[24px] text-[14px] leading-[20px] font-bold text-ink">
              TENTAR NOVAMENTE
            </button>
          </MobileNftDetailMessage>
        ) : (
          <MobileNftDetail key={detail.data.id} nft={detail.data} />
        )}
      </main>
    )
  }

  return (
    <PageShell active="market">
      <div className="flex w-full flex-col items-start gap-[12px]">
        <Breadcrumb />
        {detail.isPending ? (
          <DetailSkeleton />
        ) : notFound ? (
          <DetailMessage title="NFT não encontrado">
            <p className="text-[14px] leading-[24px] text-text-secondary">
              O NFT que você procura não existe ou foi removido do mercado.
            </p>
            <Link
              to="/"
              hash="mercado"
              className="flex h-[40px] items-center rounded-[6px] bg-primary px-[28px] text-[14px] leading-[20px] font-bold text-ink"
            >
              VOLTAR AO MERCADO
            </Link>
          </DetailMessage>
        ) : detail.isError ? (
          <DetailMessage title="Não foi possível carregar este NFT">
            <p role="alert" className="text-[14px] leading-[24px] text-text-secondary">
              {isApiError(detail.error) ? detail.error.message : 'Verifique sua conexão e tente novamente.'}
            </p>
            <button
              type="button"
              onClick={() => void detail.refetch()}
              className="flex h-[40px] items-center rounded-[6px] bg-primary px-[28px] text-[14px] leading-[20px] font-bold text-ink"
            >
              TENTAR NOVAMENTE
            </button>
          </DetailMessage>
        ) : (
          <div className="flex w-full items-start gap-[32px]">
            <NftGallery name={detail.data.name} images={detail.data.images} />
            <NftPurchasePanel key={detail.data.id} nft={detail.data} />
          </div>
        )}
      </div>

      {detail.isSuccess ? (
        <NftDetailsTabs nft={detail.data} />
      ) : (
        detail.isPending && <Skeleton aria-hidden className="h-[340px] w-full rounded-[6px]" />
      )}
      {!notFound && <RelatedNfts title="Mais desta coleção" nftId={id} />}
    </PageShell>
  )
}
