import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'

import { NftImage } from '@/components/common/NftImage'
import { Hairline } from '@/components/common/Hairline'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEthLabel } from '@/lib/format'
import type { Nft } from '@/types'
import { relatedNftsQuery, trendingNftsQuery } from '../api'
import dividerSection from '@/assets/nft-detail/divider-section.svg'

const PAGE_SIZE = 5

const VARIANTS = {
  detail: { card: 'gap-[12px]', box: 'justify-center pt-[20px]', image: 'rounded-[13px]', text: '' },
  cart: { card: 'gap-[8px]', box: 'items-center justify-center', image: 'rounded-[17px]', text: 'gap-[8px]' },
} as const

type Variant = keyof typeof VARIANTS

function RelatedCard({ nft, variant }: { nft: Nft; variant: Variant }) {
  const styles = VARIANTS[variant]
  return (
    <li className="w-[219px]">
      <Link to="/nft/$id" params={{ id: nft.id }} className={cn('flex w-full flex-col items-start', styles.card)}>
        <span className={cn('flex h-[255px] w-full bg-surface-card', styles.box)}>
          <NftImage
            alt=""
            src={nft.image}
            sizes="212px"
            width={212}
            height={212}
            loading="lazy"
            className={cn('size-[212px] max-w-none object-cover', styles.image)}
          />
        </span>
        <span className={cn('flex w-full flex-col items-start', styles.text)}>
          <span className="w-full text-[15px] leading-[normal] text-foreground">{nft.name}</span>
          <span className="w-full text-[16px] leading-[16px] font-bold text-text-accent">
            <span className="sr-only">Preço: </span>
            {formatEthLabel(nft.price)}
          </span>
        </span>
      </Link>
    </li>
  )
}

function RelatedSkeleton() {
  return (
    <ul aria-hidden className="flex w-full items-center justify-between">
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <li key={index} className="flex w-[219px] flex-col gap-[12px]">
          <Skeleton className="h-[255px] w-full rounded-none" />
          <Skeleton className="h-[18px] w-[154px]" />
          <Skeleton className="h-[16px] w-[80px]" />
        </li>
      ))}
    </ul>
  )
}

export function RelatedNfts({
  title,
  nftId,
  exclude = [],
  variant = 'detail',
}: {
  title: string
  nftId?: string
  exclude?: string[]
  variant?: Variant
}) {
  const related = useQuery({ ...relatedNftsQuery(nftId ?? ''), enabled: Boolean(nftId) })
  const trending = useQuery({ ...trendingNftsQuery(), enabled: !nftId })
  const source = nftId ? related : trending
  const [page, setPage] = useState(0)
  const items = (source.data ?? []).filter((nft) => !exclude.includes(nft.id))
  const pageCount = Math.ceil(items.length / PAGE_SIZE)
  const current = Math.min(page, Math.max(0, pageCount - 1))
  const visible = items.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  const headingId = `related-heading-${variant}`

  if (source.isSuccess && items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="flex w-full flex-col items-start gap-[32px] overflow-clip">
      <div className="flex w-full flex-col items-start gap-[12px]">
        <h2 id={headingId} className="w-full text-[17px] leading-[16px] font-bold text-text-accent">
          {title}
        </h2>
        <Hairline src={dividerSection} />
      </div>

      <div className="flex w-full flex-col items-center gap-[32px]">
        {source.isPending ? (
          <RelatedSkeleton />
        ) : source.isError ? (
          <p role="alert" className="flex items-center gap-[12px] text-[14px] leading-[24px] text-text-secondary">
            Não foi possível carregar as sugestões.
            <button
              type="button"
              onClick={() => void source.refetch()}
              className="font-bold text-text-accent underline"
            >
              Tentar novamente
            </button>
          </p>
        ) : (
          <ul aria-live="polite" className="flex w-full items-start justify-between">
            {visible.map((nft) => (
              <RelatedCard key={nft.id} nft={nft} variant={variant} />
            ))}
          </ul>
        )}

        {source.isPending && <span aria-hidden className="h-[12px]" />}
        {pageCount > 1 && (
          <div role="group" aria-label="Páginas de sugestões" className="flex h-[12px] items-center gap-[12px]">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                aria-label={`Página ${index + 1} de ${pageCount}`}
                aria-current={index === current ? 'true' : undefined}
                className={cn(
                  'relative size-[12px] rounded-full border-[1.3px] border-primary after:absolute after:-inset-[4px]',
                  index === current && 'bg-primary',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
