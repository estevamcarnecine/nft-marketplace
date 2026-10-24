import { Hairline } from '@/components/common/Hairline'
import { RadioGroup } from 'radix-ui'
import { cn } from 'cn'

import { formatEthLabel, formatRating } from '@/lib/format'
import type { EditionId, NftDetail, NftEdition } from '@/types'
import { useNftPurchase } from '../use-nft-purchase'
import divider from '@/assets/nft-detail/divider-details.svg'
import heart from '@/assets/nft-detail/heart.svg'
import minus from '@/assets/nft-detail/minus.svg'
import plus from '@/assets/nft-detail/plus.svg'
import shareEmail from '@/assets/nft-detail/share-email.svg'
import shareLinkedin from '@/assets/nft-detail/share-linkedin.svg'
import shareTwitter from '@/assets/nft-detail/share-twitter.svg'
import star from '@/assets/nft-detail/star.svg'
import starEmpty from '@/assets/nft-detail/star-empty.svg'

const LABEL = 'text-[15px] leading-[16px] font-bold text-foreground'

function Rating({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-[4px]">
      <span role="img" aria-label={`Avaliação ${formatRating(rating)} de 5`} className="flex items-center gap-[4px]">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="relative size-[15px] shrink-0">
            <span className="absolute inset-[10.42%_8.32%_10.41%_8.33%]">
              <img alt="" src={index < filled ? star : starEmpty} className="absolute inset-0 block size-full max-w-none" />
            </span>
          </span>
        ))}
      </span>
      <span className="text-[15px] leading-[normal] whitespace-nowrap text-foreground">
        {count} avaliações de colecionadores
      </span>
    </div>
  )
}

function EditionPicker({
  editions,
  value,
  onChange,
}: {
  editions: NftEdition[]
  value: EditionId | undefined
  onChange: (id: EditionId) => void
}) {
  return (
    <div className="flex w-[209px] flex-col items-start gap-[12px]">
      <span id="edition-label" className={cn(LABEL, 'w-full')}>
        Edição:
      </span>
      <RadioGroup.Root
        aria-labelledby="edition-label"
        value={value}
        onValueChange={(next) => {
          const edition = editions.find((item) => item.id === next)
          if (edition) onChange(edition.id)
        }}
        orientation="horizontal"
        className="flex w-full items-center gap-[6px]"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <RadioGroup.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              title={soldOut ? 'Edição esgotada' : `${edition.available} disponíveis`}
              className={cn(
                'flex h-[28px] min-w-[36px] shrink-0 items-center justify-center rounded-[50%] border-2 border-border px-[5px] text-[14px] leading-[16px] whitespace-nowrap text-text-secondary',
                'data-[state=checked]:border-primary data-[state=checked]:font-medium data-[state=checked]:text-text-accent',
                'disabled:cursor-not-allowed disabled:line-through disabled:opacity-60',
              )}
            >
              {edition.label}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </RadioGroup.Item>
          )
        })}
      </RadioGroup.Root>
    </div>
  )
}

function StepButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[49.5px] w-[33px] shrink-0 flex-col items-center justify-center rounded-[33px] border border-ink bg-primary drop-shadow-[0px_6.6px_9.9px_rgba(20,13,10,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <img alt="" src={icon} className="block size-[26.4px] max-w-none" />
    </button>
  )
}

export function NftPurchasePanel({ nft }: { nft: NftDetail }) {
  const purchase = useNftPurchase(nft)
  const { quantity, maxQuantity, canBuy } = purchase
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href
  const shareText = `${nft.name} na Kurio`

  return (
    <div className="flex min-w-px flex-1 flex-col items-start justify-between self-stretch">
      <div className="flex w-full flex-col items-start gap-[12px]">
        <div className="flex w-full flex-col items-start gap-[12px]">
          <h1 className="w-full text-[28px] leading-[normal] font-bold text-foreground">{nft.name}</h1>
          <div className="flex w-full items-center justify-between">
            <p className="text-[22px] leading-[16px] font-bold whitespace-nowrap text-text-accent">
              <span className="sr-only">Preço: </span>
              {formatEthLabel(nft.price)}
            </p>
            <Rating rating={nft.rating} count={nft.reviewCount} />
          </div>
        </div>
        <Hairline src={divider} className="w-[573px]" />
      </div>

      <section aria-labelledby="about-label" className="flex w-[574px] flex-col items-start gap-[12px]">
        <h2 id="about-label" className={cn(LABEL, 'w-full')}>
          Sobre este NFT:
        </h2>
        <p className="min-h-[66px] w-full text-[14px] leading-[24px] text-text-secondary">{nft.description}</p>
      </section>

      <EditionPicker editions={nft.editions} value={purchase.editionId} onChange={purchase.changeEdition} />

      <div className="flex w-full items-start justify-between">
        <div role="group" aria-label="Quantidade" className="flex items-center gap-[12px]">
          <StepButton
            icon={minus}
            label="Diminuir quantidade"
            disabled={quantity <= 1}
            onClick={purchase.decrement}
          />
          <output aria-live="polite" className="text-[20px] leading-[28px] whitespace-nowrap text-foreground">
            {quantity}
          </output>
          <StepButton
            icon={plus}
            label="Aumentar quantidade"
            disabled={quantity >= maxQuantity}
            onClick={purchase.increment}
          />
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => purchase.add({ goToCart: true })}
            disabled={!canBuy || purchase.adding}
            aria-busy={purchase.adding}
            className="flex h-[40px] w-[130px] items-center justify-center rounded-[6px] bg-primary text-[14px] leading-[20px] font-bold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {purchase.adding ? 'ADICIONANDO…' : canBuy ? 'COMPRAR' : 'ESGOTADO'}
          </button>
          <button
            type="button"
            onClick={purchase.favorite}
            aria-pressed={nft.favorited}
            disabled={purchase.favoritePending}
            className={cn(
              'flex h-[40px] w-[130px] items-center justify-center gap-[8px] rounded-[6px] border border-primary disabled:cursor-wait',
              nft.favorited && 'bg-surface-dark',
            )}
          >
            <img alt="" src={heart} className="block size-[20px] max-w-none" />
            <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap text-text-accent">
              {nft.favorited ? 'Favoritado' : 'Favoritar'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex w-[308px] flex-col items-start gap-[12px]">
        <dl className="flex w-full flex-col items-start gap-[12px] text-[15px] leading-[normal] text-secondary">
          <div className="flex w-full gap-[1ch]">
            <dt>ID do token:</dt>
            <dd>{nft.tokenId}</dd>
          </div>
          <div className="flex w-full gap-[1ch]">
            <dt>Coleção:</dt>
            <dd>{nft.collectionName}</dd>
          </div>
          <div className="flex w-full gap-[1ch]">
            <dt>Atributos:</dt>
            <dd>{nft.attributes.join(', ')}</dd>
          </div>
        </dl>
        <div className="flex items-center gap-[8px]">
          <span className="text-[15px] leading-[16px] font-bold whitespace-nowrap text-foreground">
            Compartilhar este NFT:
          </span>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no LinkedIn (abre em nova aba)"
            className="relative h-[14.375px] w-[15px] shrink-0"
          >
            <img alt="" src={shareLinkedin} className="absolute inset-0 block size-full max-w-none" />
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`}
            aria-label="Compartilhar por e-mail"
            className="relative size-[18px] shrink-0"
          >
            <img alt="" src={shareEmail} className="absolute inset-0 block size-full max-w-none" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no Twitter (abre em nova aba)"
            className="relative h-[12.191px] w-[15.966px] shrink-0"
          >
            <img alt="" src={shareTwitter} className="absolute inset-0 block size-full max-w-none" />
          </a>
        </div>
      </div>

    </div>
  )
}
