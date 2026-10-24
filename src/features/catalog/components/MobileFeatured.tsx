import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEthLabel } from '@/lib/format'
import { featuredQuery } from '../api'

const BOX = 'linear-gradient(139.55deg, #241612 12%, #2f1d15 106.59%)'

export function MobileFeatured() {
  const featured = useQuery(featuredQuery)
  const nft = featured.data

  if (featured.isError) return null

  return (
    <section aria-labelledby="mobile-featured-title" className="w-full">
      {nft ? (
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="flex h-[96px] w-full items-center gap-[12px] rounded-[20px] p-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          style={{ backgroundImage: BOX }}
        >
          <NftImage
            alt=""
            src={nft.image}
            sizes="80px"
            width={80}
            height={80}
            className="size-[80px] shrink-0 rounded-[16px] object-cover"
          />
          <span className="flex min-w-px flex-1 flex-col items-start gap-[6px]">
            <span id="mobile-featured-title" className="text-[12px] leading-[14px] font-bold text-text-accent">
              NFT EM DESTAQUE · OFERTA LIMITADA
            </span>
            <span className="w-full truncate text-[15px] leading-[normal] text-foreground">{nft.name}</span>
            <span className="flex items-baseline gap-[8px]">
              <span className="text-[16px] leading-[16px] font-bold text-text-accent">{formatEthLabel(nft.price)}</span>
              {nft.compareAtPrice && (
                <span className="text-[12px] leading-[16px] text-secondary line-through">
                  <span className="sr-only">Preço anterior: </span>
                  {formatEthLabel(nft.compareAtPrice)}
                </span>
              )}
            </span>
          </span>
        </Link>
      ) : (
        <Skeleton aria-hidden className="h-[96px] w-full rounded-[20px]" />
      )}
    </section>
  )
}
