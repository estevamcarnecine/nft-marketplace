import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { CircleX, LoaderCircle } from 'lucide-react'

import { NftImage } from '@/components/common/NftImage'
import { Hairline } from '@/components/common/Hairline'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEthLabel, formatShortDate, shortHash } from '@/lib/format'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { NetworkId, Order } from '@/types'
import closeIcon from '@/assets/order/close.svg'
import divider from '@/assets/order/divider.svg'
import metaSeparator from '@/assets/order/meta-separator.svg'
import thankYou from '@/assets/order/thank-you.svg'

const EXPLORERS: Record<NetworkId, string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
}

const PRIMARY_BUTTON =
  'flex items-center overflow-clip rounded-[5px] bg-primary p-[16px] text-[16px] leading-[16px] font-bold whitespace-nowrap text-ink'

function networkLabel(network: NetworkId): string {
  return NETWORKS.find((item) => item.id === network)?.label ?? network
}

function MetaSeparator() {
  return (
    <span aria-hidden className="flex h-[31px] w-0 shrink-0 items-center justify-center max-sm:hidden">
      <img alt="" src={metaSeparator} className="block h-px w-[31px] max-w-none rotate-90" />
    </span>
  )
}

function Meta({ label, value, bold, minWidth }: { label: string; value: ReactNode; bold?: boolean; minWidth: string }) {
  return (
    <div className={`flex shrink-0 flex-col items-start whitespace-nowrap text-text-secondary max-sm:min-w-0 ${minWidth}`}>
      <dt className={`text-[14px] leading-[16px] ${bold ? 'font-bold' : ''}`}>{label}</dt>
      <dd className="text-[15px] leading-[normal]">{value}</dd>
    </div>
  )
}

function Header({ order }: { order: Order | undefined }) {
  const status = order?.status
  const icon =
    status === 'confirmed' ? (
      <span className="relative size-[80px] overflow-clip">
        <span className="absolute inset-[0_9.27%]">
          <img alt="" src={thankYou} className="absolute inset-0 block size-full max-w-none" />
        </span>
      </span>
    ) : status === 'rejected' ? (
      <CircleX aria-hidden strokeWidth={1.5} className="size-[64px] text-text-coral" />
    ) : (
      <LoaderCircle aria-hidden strokeWidth={1.5} className="size-[64px] animate-spin text-primary motion-reduce:animate-none" />
    )
  const title =
    status === 'confirmed'
      ? 'Seus NFTs agora estão na sua carteira'
      : status === 'rejected'
        ? 'Pagamento recusado'
        : 'Aguardando a confirmação da rede'

  return (
    <div className="flex h-[156px] w-full shrink-0 flex-col items-center justify-center gap-[16px] overflow-clip">
      {icon}
      <Dialog.Title className="text-center text-[16px] leading-[16px] font-bold whitespace-nowrap text-text-secondary max-sm:px-[40px] max-sm:leading-[22px] max-sm:whitespace-normal">
        {order ? title : 'Carregando pedido…'}
      </Dialog.Title>
    </div>
  )
}

function Lines({ order }: { order: Order }) {
  return (
    <ul aria-label="Itens comprados" className="flex w-full flex-col items-start gap-[12px] overflow-clip">
      {order.lines.map((line) => (
        <li key={`${line.nftId}-${line.editionId}`} className="flex h-[70px] w-full items-center justify-between bg-surface-card">
          <span className="flex min-w-px items-center gap-[12px]">
            <NftImage
              alt=""
              src={line.image}
              sizes="70px"
              width={70}
              height={70}
              className="size-[70px] max-w-none shrink-0 rounded-[8px] object-cover"
            />
            <span className="flex w-[164px] flex-col items-start gap-[6px] leading-[16px] max-sm:w-auto max-sm:min-w-px">
              <span className="w-full text-[16px] font-bold text-foreground">{line.name}</span>
              <span className="w-full text-[14px] text-secondary">
                Token {line.tokenId} · {line.editionLabel}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-[48px] leading-[16px] whitespace-nowrap max-sm:flex-col max-sm:items-end max-sm:gap-[6px] max-sm:pr-[8px]">
            <span className="w-[67px] text-center text-[14px] text-text-secondary max-sm:w-auto">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </span>
            <span className="w-[100px] text-right text-[18px] font-bold text-text-accent max-sm:w-auto max-sm:text-[16px]">
              {formatEthLabel(line.lineTotal)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Footer({ order }: { order: Order }) {
  const network = networkLabel(order.wallet.network)
  if (order.status === 'confirmed') {
    return (
      <>
        <p className="min-w-full text-center text-[14px] leading-[22px] text-text-secondary">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e registrada na
          rede.
        </p>
        {order.txHash && (
          <Link to="/explorer/tx/$hash" params={{ hash: order.txHash }} className={PRIMARY_BUTTON}>
            Ver no {EXPLORERS[order.wallet.network]}
          </Link>
        )}
      </>
    )
  }
  if (order.status === 'rejected') {
    return (
      <>
        <p role="alert" className="min-w-full text-center text-[14px] leading-[22px] text-text-secondary">
          {order.rejectionReason ?? 'O pagamento foi recusado.'} Nenhum valor foi cobrado e os itens continuam no seu
          carrinho.
        </p>
        <Link to="/cart" className={PRIMARY_BUTTON}>
          Voltar ao carrinho
        </Link>
      </>
    )
  }
  return (
    <p className="min-w-full text-center text-[14px] leading-[22px] text-text-secondary">
      Seu pagamento está sendo processado na {network}. Você pode fechar esta janela: o pedido continua e esta página
      mostra o resultado assim que a rede confirmar.
    </p>
  )
}

export function OrderReceipt({
  order,
  error,
  onClose,
}: {
  order: Order | undefined
  error: ReactNode
  onClose: () => void
}) {
  const wallet = order && WALLET_TYPES.find((item) => item.id === order.wallet.type)?.label

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* The Figma scrim is opaque ink; it also scrolls when the receipt is taller than the window. */}
        <Dialog.Overlay className="fixed inset-0 z-50 overflow-y-auto bg-ink">
          <Dialog.Content
            aria-describedby="order-receipt-summary"
            className="relative mx-auto my-[166px] flex w-[578px] max-w-[calc(100vw-32px)] flex-col items-start bg-surface-card outline-none max-sm:my-[16px]"
          >
            <Header order={order} />
            <span aria-hidden className="h-px w-full shrink-0 bg-primary" />

            {error ? (
              <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-[16px] px-[44px] text-center">
                {error}
              </div>
            ) : (
              <>
                <div className="flex h-[65px] w-full shrink-0 flex-col items-start px-[36px] py-[4px] max-sm:h-auto max-sm:px-[20px] max-sm:py-[12px]">
                  <dl id="order-receipt-summary" className="flex min-h-px w-full flex-1 items-center justify-between max-sm:grid max-sm:grid-cols-2 max-sm:gap-[12px]">
                    <Meta
                      bold
                      label="ID da transação"
                      minWidth="min-w-[127px]"
                      value={
                        order ? (
                          order.txHash ? (
                            <span title={order.txHash}>{shortHash(order.txHash)}</span>
                          ) : order.status === 'pending' ? (
                            'Pendente'
                          ) : (
                            '—'
                          )
                        ) : (
                          <Skeleton className="mt-[2px] h-[16px] w-[110px]" />
                        )
                      }
                    />
                    <MetaSeparator />
                    <Meta
                      label="Data"
                      minWidth="min-w-[109px]"
                      value={order ? formatShortDate(order.createdAt) : <Skeleton className="mt-[2px] h-[16px] w-[100px]" />}
                    />
                    <MetaSeparator />
                    <Meta
                      label="Total"
                      minWidth="min-w-[91px]"
                      value={order ? formatEthLabel(order.total) : <Skeleton className="mt-[2px] h-[16px] w-[90px]" />}
                    />
                    <MetaSeparator />
                    <Meta
                      bold
                      label="Carteira"
                      minWidth="min-w-[73px]"
                      value={order ? wallet : <Skeleton className="mt-[2px] h-[16px] w-[70px]" />}
                    />
                  </dl>
                </div>
                <span aria-hidden className="h-px w-full shrink-0 bg-primary" />

                <div className="flex w-full flex-col items-start">
                  <div className="flex min-h-[588px] w-full flex-col items-start gap-[12px] overflow-clip px-[44px] pt-[20px] pb-[48px] max-sm:min-h-0 max-sm:px-[16px] max-sm:pb-[32px]">
                    <h3 className="text-[15px] leading-[16px] font-bold whitespace-nowrap text-foreground">
                      Detalhes da transação
                    </h3>
                    <div className="flex w-full flex-col items-start gap-[12px]">
                      <div className="flex w-full flex-col items-end gap-[12px]">
                        <div className="flex w-full flex-col items-start gap-[12px]">
                          <div className="flex w-full flex-col items-start gap-[12px]">
                            <div aria-hidden className="flex w-full items-center justify-between text-[16px] leading-[16px] whitespace-nowrap text-foreground">
                              <span className="font-bold">NFTs</span>
                              <span className="flex items-center gap-[48px] max-sm:gap-[12px]">
                                <span className="w-[67px] text-center font-bold max-sm:hidden">Edições</span>
                                <span className="w-[100px] text-right font-medium max-sm:w-auto">Subtotal</span>
                              </span>
                            </div>
                            <Hairline src={divider} />
                          </div>
                          {order ? (
                            <Lines order={order} />
                          ) : (
                            <div className="flex w-full flex-col gap-[12px]">
                              {Array.from({ length: 3 }, (_, index) => (
                                <Skeleton key={index} className="h-[70px] w-full" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex w-[321px] flex-col items-end justify-center gap-[12px] whitespace-nowrap max-sm:w-full">
                          <p className="flex w-full items-center justify-between text-foreground">
                            <span className="text-[15px] leading-[normal]">Taxa de rede</span>
                            <span className="text-right text-[18px] leading-[16px]">
                              {order ? formatEthLabel(order.networkFee) : '—'}
                            </span>
                          </p>
                          <p className="flex w-full items-center justify-between leading-[16px] font-bold">
                            <span className="text-[16px] text-foreground">Total</span>
                            <span className="text-right text-[18px] text-text-accent">
                              {order ? formatEthLabel(order.total) : '—'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Hairline src={divider} />
                    </div>
                    <div aria-live="polite" className="flex min-h-px w-full flex-1 flex-col items-center justify-between gap-[20px] overflow-clip">
                      {order && <Footer order={order} />}
                    </div>
                  </div>
                  <span aria-hidden className="h-[10px] w-full shrink-0 bg-primary" />
                </div>
              </>
            )}

            <Dialog.Close
              aria-label="Fechar"
              className="absolute top-[16.75px] right-[14px] h-[17.345px] w-[18px]"
            >
              <img alt="" src={closeIcon} className="absolute inset-0 block size-full max-w-none" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
