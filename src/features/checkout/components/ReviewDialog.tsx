import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Hairline } from '@/components/common/Hairline'
import { formatEth } from '@/lib/eth'
import { formatEthLabel, shortAddress } from '@/lib/format'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { Quote, WalletSession } from '@/types'
import dividerTotal from '@/assets/checkout/divider-total.svg'

const ROW = 'flex w-full items-center justify-between gap-[12px] text-[15px] leading-[normal] text-foreground'

export function ReviewDialog({
  open,
  quote,
  session,
  recipient,
  changedNotice,
  staleNotice,
  submitting,
  requoting,
  onConfirm,
  onRequote,
  onClose,
}: {
  open: boolean
  quote: Quote | null
  session: WalletSession | null
  recipient: string
  changedNotice: string | null
  staleNotice: string | null
  submitting: boolean
  requoting: boolean
  onConfirm: () => void
  onRequote: () => void
  onClose: () => void
}) {
  const network = NETWORKS.find((item) => item.id === session?.network)?.label
  const wallet = WALLET_TYPES.find((item) => item.id === session?.type)?.label

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent
        showCloseButton={!submitting}
        onInteractOutside={(event) => submitting && event.preventDefault()}
        onEscapeKeyDown={(event) => submitting && event.preventDefault()}
        className="w-[500px] max-w-[calc(100vw-32px)] gap-[20px] rounded-[6px] border-border bg-background p-[32px] sm:max-w-[500px]"
      >
        <div className="flex flex-col gap-[8px]">
          <DialogTitle className="text-[24px] leading-[normal] font-bold text-foreground">
            Revise seu pedido
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-[22px] text-text-secondary">
            Confira os valores atualizados antes de assinar o pagamento na sua carteira.
          </DialogDescription>
        </div>

        {staleNotice ? (
          <p
            role="alert"
            className="rounded-[3px] border border-primary bg-surface-dark p-[12px] text-[14px] leading-[20px] text-text-accent"
          >
            {staleNotice}
          </p>
        ) : (
          changedNotice && (
            <p
              role="alert"
              className="rounded-[3px] border border-primary bg-surface-dark p-[12px] text-[14px] leading-[20px] text-text-accent"
            >
              {changedNotice}
            </p>
          )
        )}

        {quote && (
          <>
            <ul aria-label="Itens do pedido" className="flex flex-col gap-[8px]">
              {quote.lines.map((line) => (
                <li key={`${line.nftId}-${line.editionId}`} className={ROW}>
                  <span className="min-w-px flex-1 truncate">
                    {line.name}{' '}
                    <span className="text-secondary">
                      · {line.editionLabel} · x{line.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-text-accent">{formatEthLabel(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <Hairline src={dividerTotal} />
            <div className="flex flex-col gap-[8px]">
              <p className={ROW}>
                <span>Subtotal</span>
                <span>{formatEthLabel(quote.subtotal)}</span>
              </p>
              <p className={ROW}>
                <span>Desconto{quote.promoCode ? ` (${quote.promoCode})` : ''}</span>
                <span>(-) {formatEth(quote.discount)}</span>
              </p>
              <p className={ROW}>
                <span>Taxa de rede</span>
                <span>{formatEthLabel(quote.networkFee)}</span>
              </p>
              <p className={`${ROW} font-bold`}>
                <span className="text-[16px]">Total</span>
                <span className="text-[18px] text-text-accent">{formatEthLabel(quote.total)}</span>
              </p>
            </div>
          </>
        )}

        {session && (
          <p className="text-[14px] leading-[22px] text-text-secondary">
            Pagamento com {wallet} na rede {network} ({shortAddress(session.address)}). Entrega dos NFTs em{' '}
            {shortAddress(recipient)}.
          </p>
        )}

        <div className="flex items-center justify-end gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-[40px] items-center justify-center rounded-[6px] border border-primary px-[20px] text-[14px] leading-[20px] font-medium text-text-accent disabled:opacity-60"
          >
            Voltar e editar
          </button>
          {staleNotice ? (
            <button
              type="button"
              onClick={onRequote}
              disabled={requoting}
              aria-busy={requoting}
              className="flex h-[40px] items-center justify-center rounded-[6px] bg-primary px-[20px] text-[14px] leading-[20px] font-bold text-ink disabled:opacity-60"
            >
              {requoting ? 'Atualizando valores…' : 'Atualizar valores'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting || !quote}
              aria-busy={submitting}
              className="flex h-[40px] items-center justify-center rounded-[6px] bg-primary px-[20px] text-[14px] leading-[20px] font-bold text-ink disabled:opacity-60"
            >
              {submitting ? 'Enviando pedido…' : changedNotice ? 'Confirmar novos valores' : 'Confirmar pagamento'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
