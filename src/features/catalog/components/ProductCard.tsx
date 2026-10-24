import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from 'cn'

import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api'
import { formatEthLabel } from '@/lib/format'
import type { Nft } from '@/types'
import { useQuickAddToCart } from '../api'
import { useCardFavorite } from '../use-card-favorite'
import cartIcon from '@/assets/catalog/action-cart.svg'
import heartIcon from '@/assets/catalog/action-heart.svg'
import viewIcon from '@/assets/catalog/action-view.svg'

const ACTION =
  'flex size-[35px] items-center justify-center rounded-[4px] border border-border bg-surface-raised hover:border-primary disabled:opacity-60'

export function ProductCardSkeleton() {
  return (
    <li aria-hidden className="flex w-[258px] flex-col items-start gap-[12px]">
      <Skeleton className="h-[300px] w-full rounded-none" />
      <Skeleton className="h-[16px] w-[164px]" />
      <Skeleton className="h-[16px] w-[90px]" />
    </li>
  )
}

export function ProductCard({ nft, eager, firstRow }: { nft: Nft; eager?: boolean; firstRow?: boolean }) {
  const quickAdd = useQuickAddToCart()
  const favorite = useCardFavorite(nft)

  function addToCart() {
    quickAdd.mutate(nft.id, {
      onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho.`),
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.'),
    })
  }

  return (
    <li className="group relative flex w-[258px] flex-col items-start gap-[12px]">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="flex w-full flex-col items-start gap-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <span className="flex h-[300px] w-full items-start justify-center bg-surface-card px-[4px] pt-[24px]">
          <NftImage
            alt=""
            src={nft.image}
            sizes="250px"
            width={250}
            height={250}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="size-[250px] max-w-none rounded-[15px] object-cover"
          />
        </span>
        <span className={cn('flex w-full flex-col items-start leading-[16px]', firstRow ? 'gap-[12px]' : 'gap-[6px]')}>
          <span className="w-full text-[16px] text-foreground">{nft.name}</span>
          <span className="flex items-center gap-[12px] text-[18px] whitespace-nowrap">
            <span className="font-bold text-text-accent">
              <span className="sr-only">Preço: </span>
              {formatEthLabel(nft.price)}
            </span>
            {nft.compareAtPrice && (
              <span className="text-secondary line-through">
                <span className="sr-only">Antes: </span>
                {formatEthLabel(nft.compareAtPrice)}
              </span>
            )}
          </span>
        </span>
      </Link>

      <div
        className={cn(
          'absolute top-[258px] left-[67px] flex h-[35px] w-[125px] items-center justify-between',
          'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none',
        )}
      >
        <button type="button" onClick={addToCart} disabled={quickAdd.isPending} aria-label={`Adicionar ${nft.name} ao carrinho`} className={ACTION}>
          <img alt="" src={cartIcon} className="block size-[20px] max-w-none" />
        </button>
        <button
          type="button"
          onClick={favorite.toggle}
          disabled={favorite.pending}
          aria-pressed={nft.favorited}
          aria-label={nft.favorited ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
          className={cn(ACTION, nft.favorited && 'border-primary bg-primary/20')}
        >
          <img alt="" src={heartIcon} className="block size-[20px] max-w-none" />
        </button>
        <Link to="/nft/$id" params={{ id: nft.id }} aria-label={`Ver detalhes de ${nft.name}`} className={ACTION}>
          <img alt="" src={viewIcon} className="block h-[20px] w-[19.991px] max-w-none" />
        </Link>
      </div>
    </li>
  )
}
