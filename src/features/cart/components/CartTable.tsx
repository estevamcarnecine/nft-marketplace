import { Link } from '@tanstack/react-router'

import { Hairline } from '@/components/common/Hairline'
import { NftImage } from '@/components/common/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEthLabel } from '@/lib/format'
import type { CartLine } from '@/types'
import { useCartLineActions } from '../use-cart-actions'
import deleteIcon from '@/assets/cart/delete.svg'
import divider from '@/assets/cart/divider-table.svg'
import minus from '@/assets/cart/minus.svg'
import plus from '@/assets/cart/plus.svg'

const ROW = 'flex h-[70px] w-full items-center justify-between bg-surface-card pr-[24px]'
const COLUMNS = {
  nft: 'w-[250px] shrink-0',
  price: 'w-[77px] shrink-0',
  quantity: 'w-[75px] shrink-0',
  total: 'w-[87px] shrink-0',
  action: 'w-[24px] shrink-0',
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
      className="flex h-[30px] w-[20px] shrink-0 items-center justify-center rounded-[20px] border border-ink bg-primary drop-shadow-[0px_4px_6px_rgba(20,13,10,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <img alt="" src={icon} className="block size-[16px] max-w-none" />
    </button>
  )
}

function CartRow({ line }: { line: CartLine }) {
  const { changeQuantity, removeLine, busy, unavailable, max } = useCartLineActions(line)
  const name = `${line.nft.name} (edição ${line.edition.label})`

  return (
    <li aria-busy={busy} className={ROW} data-unavailable={unavailable || undefined}>
      <Link to="/nft/$id" params={{ id: line.nft.id }} className={`${COLUMNS.nft} flex h-full items-center gap-[16px]`}>
        <NftImage
          alt=""
          src={line.nft.image}
          sizes="70px"
          width={70}
          height={70}
          className="size-[70px] max-w-none shrink-0 rounded-[6px] object-cover"
        />
        <span className="flex w-[164px] flex-col items-start gap-[6px] leading-[16px]">
          <span className="w-full text-[16px] font-bold text-foreground">{line.nft.name}</span>
          {unavailable ? (
            <span className="w-full text-[14px] font-bold text-destructive">
              {line.edition.available === 0 ? 'Edição esgotada' : `Restam ${line.edition.available} unid.`}
            </span>
          ) : (
            <span className="w-full text-[14px] text-secondary">
              Token {line.nft.tokenId} · {line.edition.label}
            </span>
          )}
        </span>
      </Link>
      <p className={`${COLUMNS.price} text-[16px] leading-[16px] font-bold whitespace-nowrap text-text-secondary`}>
        <span className="sr-only">Preço unitário: </span>
        {formatEthLabel(line.nft.price)}
      </p>
      <div
        role="group"
        aria-label={`Quantidade de ${name}`}
        className={`${COLUMNS.quantity} flex items-center justify-between`}
      >
        <StepButton
          icon={minus}
          label={`Diminuir quantidade de ${line.nft.name}`}
          disabled={busy || line.quantity <= 1}
          onClick={() => changeQuantity(line.quantity - 1)}
        />
        <output aria-live="polite" className="text-[17px] leading-[24px] whitespace-nowrap text-foreground">
          {line.quantity}
        </output>
        <StepButton
          icon={plus}
          label={`Aumentar quantidade de ${line.nft.name}`}
          disabled={busy || line.quantity >= max}
          onClick={() => changeQuantity(line.quantity + 1)}
        />
      </div>
      <p className={`${COLUMNS.total} text-[16px] leading-[16px] font-bold whitespace-nowrap text-text-accent`}>
        <span className="sr-only">Total da linha: </span>
        {formatEthLabel(line.lineTotal)}
      </p>
      <div className={`${COLUMNS.action} flex items-center`}>
        <button
          type="button"
          onClick={removeLine}
          disabled={busy}
          aria-label={`Remover ${name} do carrinho`}
          className="relative size-[24px] disabled:cursor-wait disabled:opacity-50"
        >
          <span className="absolute inset-[11.31%_15.15%_11.68%_17.56%]">
            <span className="absolute inset-[-4.06%_-4.64%]">
              <img alt="" src={deleteIcon} className="block size-full max-w-none" />
            </span>
          </span>
        </button>
      </div>
      {unavailable && (
        <span role="alert" className="sr-only">
          {line.edition.available === 0
            ? `${name} esgotou.`
            : `Restam apenas ${line.edition.available} unidades de ${name}.`}
        </span>
      )}
    </li>
  )
}

function TableHeader() {
  return (
    <div
      aria-hidden
      className="flex w-full items-center justify-between pr-[24px] text-[16px] leading-[16px] whitespace-nowrap text-foreground"
    >
      <span className={`${COLUMNS.nft} font-bold`}>NFTs</span>
      <span className={`${COLUMNS.price} font-medium`}>Preço</span>
      <span className={`${COLUMNS.quantity} font-bold`}>Edições</span>
      <span className={`${COLUMNS.total} font-medium`}>Total</span>
      <span className={COLUMNS.action} />
    </div>
  )
}

export function CartTable({
  lines,
  status,
  onRetry,
}: {
  lines: CartLine[]
  status: 'pending' | 'error' | 'success'
  onRetry: () => void
}) {
  return (
    <section
      aria-label="Itens do carrinho"
      className="flex w-[782px] shrink-0 flex-col items-start gap-[12px] overflow-clip"
    >
      <TableHeader />
      <Hairline src={divider} />
      {status === 'pending' ? (
        <ul aria-busy="true" aria-label="Carregando carrinho" className="flex w-full flex-col gap-[12px]">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-[70px] w-full rounded-none" />
            </li>
          ))}
        </ul>
      ) : status === 'error' ? (
        <div
          role="alert"
          className={`${ROW} justify-start gap-[16px] px-[24px] text-[14px] leading-[24px] text-text-secondary`}
        >
          Não foi possível carregar seu carrinho.
          <button type="button" onClick={onRetry} className="font-bold text-text-accent underline">
            Tentar novamente
          </button>
        </div>
      ) : lines.length === 0 ? (
        <div className={`${ROW} justify-start gap-[16px] px-[24px] text-[14px] leading-[24px] text-text-secondary`}>
          Seu carrinho está vazio.
          <Link to="/" hash="mercado" className="font-bold text-text-accent underline">
            Explorar o mercado
          </Link>
        </div>
      ) : (
        <ul className="flex w-full flex-col items-start gap-[12px]">
          {lines.map((line) => (
            <CartRow key={line.id} line={line} />
          ))}
        </ul>
      )}
    </section>
  )
}
