import { Link } from '@tanstack/react-router'
import { cn } from 'cn'

import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEthLabel } from '@/lib/format'
import type { Nft } from '@/types'
import { useCardFavorite } from '../use-card-favorite'
import heartBadge from '@/assets/mobile/home/card-heart.svg'

const BOX = 'linear-gradient(139.55deg, #241612 12%, #2f1d15 106.59%)'

/**
 * Figma "Mobile / Início" product card (P-1…P-4). In the two-column phone grid the right column
 * sits 32px lower and swaps the box padding (20 top / 12 bottom), as in the frame.
 */
export function MobileProductCard({ nft, eager }: { nft: Nft; eager?: boolean }) {
  const favorite = useCardFavorite(nft)

  return (
    <li className="group/card relative flex min-w-px flex-col max-md:even:translate-y-[32px]">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="flex w-full flex-col items-start gap-[8px] rounded-[20px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <span
          className="flex w-full items-start rounded-[20px] px-[4px] pt-[12px] pb-[20px] max-md:group-even/card:pt-[20px] max-md:group-even/card:pb-[12px]"
          style={{ backgroundImage: BOX }}
        >
          <NftImage
            alt=""
            src={nft.image}
            sizes="(min-width: 1024px) 220px, (min-width: 768px) 30vw, 46vw"
            width={168}
            height={168}
            loading={eager ? 'eager' : 'lazy'}
            className="block aspect-square w-full rounded-[16px] object-cover"
          />
        </span>
        <span className="flex w-full flex-col items-start pl-[8px]">
          <span className="w-full truncate text-[15px] leading-[normal] text-foreground">{nft.name}</span>
          <span className="w-full text-[16px] leading-[16px] font-bold text-text-accent">{formatEthLabel(nft.price)}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={favorite.toggle}
        disabled={favorite.pending}
        aria-pressed={nft.favorited}
        aria-label={nft.favorited ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
        // Over the art's top-right corner; 44px touch target around the 28px badge.
        className="absolute top-[4px] right-[2px] flex size-[44px] items-center justify-center rounded-full disabled:opacity-60 max-md:group-even/card:top-[12px]"
      >
        <img
          alt=""
          src={heartBadge}
          className={cn('block size-[28px] max-w-none rounded-full', nft.favorited && 'ring-2 ring-primary')}
        />
      </button>
    </li>
  )
}

export function MobileProductCardSkeleton() {
  return (
    <li aria-hidden className="flex min-w-px flex-col gap-[8px] max-md:even:translate-y-[32px]">
      <Skeleton className="aspect-[175/200] w-full rounded-[20px]" />
      <Skeleton className="ml-[8px] h-[16px] w-3/4" />
      <Skeleton className="ml-[8px] h-[16px] w-1/3" />
    </li>
  )
}
