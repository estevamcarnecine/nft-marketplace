import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Hairline } from '@/components/common/Hairline'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'

import { Skeleton } from '@/components/ui/skeleton'
import { formatEthLabel } from '@/lib/format'
import type { Nft } from '@/types'
import { relatedNftsQuery } from '../api'
import dividerSection from '@/assets/nft-detail/divider-section.svg'

const PAGE_SIZE = 5

function RelatedCard({ nft }: { nft: Nft }) {
  return (
    <li className="w-[219px]">
      <Link to="/nft/$id" params={{ id: nft.id }} className="flex w-full flex-col items-start gap-[12px]">
        <span className="flex h-[255px] w-full justify-center bg-surface-card pt-[20px]">
          <img
            alt=""
            src={nft.image}
            width={212}
            height={212}
            loading="lazy"
            className="size-[212px] max-w-none rounded-[13px] object-cover"
          />
        </span>
        <span className="flex w-full flex-col items-start">
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

export function RelatedNfts({ nftId }: { nftId: string }) {
  const related = useQuery(relatedNftsQuery(nftId))
  const [page, setPage] = useState(0)
  const items = related.data ?? []
  const pageCount = Math.ceil(items.length / PAGE_SIZE)
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (related.isSuccess && items.length === 0) return null

  return (
    <section aria-labelledby="related-heading" className="flex w-full flex-col items-start gap-[32px] overflow-clip">
      <div className="flex w-full flex-col items-start gap-[12px]">
        <h2 id="related-heading" className="w-full text-[17px] leading-[16px] font-bold text-text-accent">
          Mais desta coleção
        </h2>
        <Hairline src={dividerSection} />
      </div>

      <div className="flex w-full flex-col items-center gap-[32px]">
        {related.isPending ? (
          <RelatedSkeleton />
        ) : related.isError ? (
          <p role="alert" className="flex items-center gap-[12px] text-[14px] leading-[24px] text-text-secondary">
            Não foi possível carregar a coleção.
            <button type="button" onClick={() => void related.refetch()} className="font-bold text-text-accent underline">
              Tentar novamente
            </button>
          </p>
        ) : (
          <ul aria-live="polite" className="flex w-full items-start justify-between">
            {visible.map((nft) => (
              <RelatedCard key={nft.id} nft={nft} />
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <div role="group" aria-label="Páginas da coleção" className="flex h-[12px] items-center gap-[8px]">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPage(index)}
                aria-label={`Página ${index + 1} de ${pageCount}`}
                aria-current={index === page ? 'true' : undefined}
                className={cn(
                  'relative size-[12px] rounded-full border-[1.3px] border-primary after:absolute after:-inset-[4px]',
                  index === page && 'bg-primary',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
