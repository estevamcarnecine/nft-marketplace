import type { ReactNode } from 'react'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { RadioGroup } from 'radix-ui'
import { cn } from 'cn'

import { Skeleton } from '@/components/ui/skeleton'
import { mulEthInt } from '@/lib/eth'
import { formatEthLabel, formatRating } from '@/lib/format'
import type { NftDetail } from '@/types'
import { useNftPurchase } from '../use-nft-purchase'
import { MobileGallery } from './MobileGallery'
import arrowLeft from '@/assets/mobile/detail/arrow-left.svg'
import arrowLeftMuted from '@/assets/mobile/cart/arrow-left.svg'
import heart from '@/assets/mobile/detail/heart.svg'
import minus from '@/assets/mobile/detail/minus.svg'
import plus from '@/assets/mobile/detail/plus.svg'
import shop from '@/assets/mobile/detail/shop.svg'
import star from '@/assets/mobile/detail/star.svg'

const HERO = 'linear-gradient(137.64deg, #241612 12%, #2f1d15 106.59%)'
const BUY = 'linear-gradient(100.37deg, #d28a4c 3.96%, rgba(210, 138, 76, 0.8) 121.97%)'
const ROUND = 'flex size-[35px] shrink-0 items-center justify-center rounded-[17.5px] border border-border bg-surface-raised'
const STEP =
  'relative flex h-[30px] w-[20px] items-center justify-center rounded-[20px] border border-ink bg-primary drop-shadow-[0px_4px_6px_rgba(20,13,10,0.15)] disabled:opacity-50 before:absolute before:inset-[-7px_-12px] before:content-[""]'

export function MobileBackButton({ label = 'Voltar', tone = 'muted' }: { label?: string; tone?: 'muted' | 'light' }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: '/' }))}
      className={cn(ROUND, 'relative before:absolute before:-inset-[5px] before:content-[""]')}
    >
      <img alt="" src={tone === 'light' ? arrowLeft : arrowLeftMuted} className="block h-[7.333px] w-[13.167px] max-w-none rotate-90" />
    </button>
  )
}

export function MobileNftDetail({ nft }: { nft: NftDetail }) {
  const purchase = useNftPurchase(nft)
  const { quantity, canBuy } = purchase

  return (
    <>
      <div className="relative h-[506px] w-full shrink-0" style={{ backgroundImage: HERO }}>
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-[8px] px-[28px] pt-[23px]">
          <div className="flex w-full items-center justify-between">
            <MobileBackButton tone="light" />
            <button
              type="button"
              onClick={purchase.favorite}
              disabled={purchase.favoritePending}
              aria-pressed={nft.favorited}
              aria-label={nft.favorited ? 'Favoritado' : 'Favoritar'}
              className={cn(ROUND, 'relative before:absolute before:-inset-[5px] before:content-[""]', nft.favorited && 'border-primary bg-surface-dark')}
            >
              <img alt="" src={heart} className="block h-[14.235px] w-[16px] max-w-none" />
            </button>
          </div>
          <MobileGallery name={nft.name} images={nft.images.length > 0 ? nft.images : [nft.image]} />
        </div>
      </div>

      <section
        aria-labelledby="nft-title"
        className="relative -mt-[114px] mx-auto flex w-full max-w-[560px] flex-col items-start gap-[12px] rounded-t-[31px] bg-surface-card px-[24px] pt-[32px] pb-[calc(188px+env(safe-area-inset-bottom))]"
      >
        <div className="flex w-full items-center justify-between gap-[12px]">
          <h1 id="nft-title" className="min-w-px text-[20px] leading-[24px] font-bold text-foreground">
            {nft.name}
          </h1>
          <p
            role="img"
            aria-label={`Avaliação ${formatRating(nft.rating)} de 5, ${nft.reviewCount} avaliações`}
            className="flex h-[27px] shrink-0 items-center gap-[4px] rounded-[32px] border border-primary px-[5px] text-[14px] leading-[16px]"
          >
            <span aria-hidden className="relative size-[14px]">
              <img alt="" src={star} className="absolute inset-[10.42%_8.32%_10.41%_8.33%] block size-auto max-w-none" />
            </span>
            <span aria-hidden className="font-medium text-foreground">
              {formatRating(nft.rating)}
            </span>
            <span aria-hidden className="text-text-secondary">({nft.reviewCount})</span>
          </p>
        </div>

        <p className="min-h-[71px] w-full text-[14px] leading-[24px] text-text-secondary">{nft.description}</p>

        <div className="flex flex-col items-start gap-[8px]">
          <span id="edition-label" className="text-[15px] leading-[16px] font-bold text-foreground">
            Edição:
          </span>
          <RadioGroup.Root
            aria-labelledby="edition-label"
            value={purchase.editionId}
            onValueChange={(next) => {
              const edition = nft.editions.find((item) => item.id === next)
              if (edition) purchase.changeEdition(edition.id)
            }}
            orientation="horizontal"
            className="flex flex-wrap items-start gap-[12px]"
          >
            {nft.editions.map((edition) => {
              const soldOut = edition.available === 0
              return (
                <RadioGroup.Item
                  key={edition.id}
                  value={edition.id}
                  disabled={soldOut}
                  className={cn(
                    'relative flex h-[28px] min-w-[42px] items-center justify-center rounded-[50%] border-2 border-border px-[4px] text-[14px] leading-[16px] whitespace-nowrap text-text-secondary',
                    'data-[state=checked]:border-primary data-[state=checked]:px-[6px] data-[state=checked]:font-medium data-[state=checked]:text-text-accent',
                    'disabled:cursor-not-allowed disabled:line-through disabled:opacity-60 before:absolute before:inset-[-8px_-4px] before:content-[""]',
                  )}
                >
                  {edition.label}
                  {soldOut && <span className="sr-only"> (esgotada)</span>}
                </RadioGroup.Item>
              )
            })}
          </RadioGroup.Root>
        </div>

        <dl className="flex flex-col items-start gap-[12px] text-[15px] leading-[normal] text-secondary">
          <div className="flex gap-[1ch]">
            <dt>ID do token:</dt>
            <dd>{nft.tokenId}</dd>
          </div>
          <div className="flex gap-[1ch]">
            <dt>Coleção:</dt>
            <dd>{nft.collectionName}</dd>
          </div>
          <div className="flex gap-[1ch]">
            <dt>Atributos:</dt>
            <dd>{nft.attributes.join(', ')}</dd>
          </div>
        </dl>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] rounded-t-[40px] bg-surface-card px-[24px] pt-[20px] pb-[calc(36px+env(safe-area-inset-bottom))] drop-shadow-[0px_0px_10px_rgba(10,6,4,0.45)]">
        <div className="flex w-full flex-col items-start gap-[20px]">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <span id="quantity-label" className="text-[15px] leading-[16px] font-medium text-text-secondary">
                Qtd.
              </span>
              <div role="group" aria-labelledby="quantity-label" className="flex items-center gap-[12px]">
                <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={purchase.decrement} className={STEP}>
                  <img alt="" src={minus} className="block size-[16px] max-w-none" />
                </button>
                <output aria-live="polite" className="text-[18px] leading-[25px] font-medium text-foreground">
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= purchase.maxQuantity}
                  onClick={purchase.increment}
                  className={STEP}
                >
                  <img alt="" src={plus} className="block size-[16px] max-w-none" />
                </button>
              </div>
            </div>
            <p className="text-right text-[20px] leading-[16px] font-bold whitespace-nowrap text-text-accent">
              <span className="sr-only">Total: </span>
              {formatEthLabel(mulEthInt(nft.price, quantity))}
            </p>
          </div>
          <div className="flex w-full items-center gap-[12px]">
            <button
              type="button"
              onClick={() => purchase.add({ goToCart: true })}
              disabled={!canBuy || purchase.adding}
              aria-busy={purchase.adding}
              className="flex h-[60px] w-[196px] items-center justify-center rounded-[40px] text-[16px] leading-[20px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
              style={{ backgroundImage: BUY }}
            >
              {purchase.adding ? 'Adicionando…' : canBuy ? 'Comprar NFT' : 'Esgotado'}
            </button>
            <button
              type="button"
              onClick={() => purchase.add({ goToCart: false })}
              disabled={!canBuy || purchase.adding}
              aria-label="Adicionar ao carrinho"
              className="flex size-[60px] shrink-0 items-center justify-center rounded-[40px] border border-border bg-surface-raised disabled:opacity-60"
            >
              <img alt="" src={shop} className="block size-[20px] max-w-none" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function MobileNftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="w-full">
      <div className="h-[506px] w-full px-[28px] pt-[23px]" style={{ backgroundImage: HERO }}>
        <div className="flex justify-between">
          <MobileBackButton tone="light" />
          <Skeleton className="size-[35px] rounded-full" />
        </div>
        <Skeleton className="mt-[8px] h-[356px] w-full rounded-[24px]" />
      </div>
      <div className="relative -mt-[114px] flex flex-col gap-[12px] rounded-t-[31px] bg-surface-card px-[24px] pt-[32px] pb-[48px]">
        <Skeleton className="h-[20px] w-2/3" />
        <Skeleton className="h-[71px] w-full" />
        <Skeleton className="h-[28px] w-1/2" />
        <Skeleton className="h-[60px] w-full" />
      </div>
    </div>
  )
}

export function MobileNftDetailMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-start gap-[16px] px-[24px] pt-[23px]">
      <MobileBackButton />
      <div className="flex w-full flex-col items-start gap-[12px] rounded-[20px] bg-surface-card p-[24px]">
        <h1 className="text-[20px] leading-[26px] font-bold text-foreground">{title}</h1>
        {children}
        <Link to="/" hash="mercado" className="text-[14px] leading-[20px] font-bold text-text-accent underline">
          Voltar ao mercado
        </Link>
      </div>
    </div>
  )
}
