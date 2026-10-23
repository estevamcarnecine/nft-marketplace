import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { PageShell } from '@/components/layout/PageShell'
import { orderQuery } from '@/features/checkout/api'
import { isApiError } from '@/lib/api'
import { formatEthLabel, shortAddress } from '@/lib/format'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  component: OrderPage,
})

// Provisional status view: the "Confirmação de Pedido" frame will replace its presentation.
// Until the Socket.IO phase, a pending order is refreshed from the REST API.
const PENDING_POLL_MS = 1500

const STATUS_COPY = {
  pending: { title: 'Pagamento em processamento', text: 'Aguardando a confirmação da rede. Você pode sair desta página: o pedido continua sendo processado.' },
  confirmed: { title: 'Pedido confirmado', text: 'Seus NFTs foram transferidos para a sua carteira.' },
  rejected: { title: 'Pagamento recusado', text: 'Nenhum valor foi cobrado e os itens continuam no seu carrinho.' },
} as const

function OrderPage() {
  const { orderId } = Route.useParams()
  const order = useQuery({
    ...orderQuery(orderId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })

  return (
    <PageShell active="market">
      <section aria-live="polite" className="flex w-full flex-col items-start gap-[16px] rounded-[6px] bg-surface-card p-[40px]">
        {order.isPending ? (
          <p aria-busy="true" className="text-[14px] leading-[24px] text-text-secondary">
            Carregando pedido…
          </p>
        ) : order.isError ? (
          <>
            <h1 className="text-[28px] leading-[normal] font-bold text-foreground">
              {isApiError(order.error) && order.error.status === 404 ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
            </h1>
            <button type="button" onClick={() => void order.refetch()} className="text-[14px] font-bold text-text-accent underline">
              Tentar novamente
            </button>
          </>
        ) : (
          <>
            <p className="text-[14px] leading-[16px] font-medium tracking-[1.4px] text-text-secondary">Pedido {order.data.id}</p>
            <h1 className="text-[28px] leading-[normal] font-bold text-foreground">{STATUS_COPY[order.data.status].title}</h1>
            <p className="text-[14px] leading-[24px] text-text-secondary">
              {order.data.rejectionReason ?? STATUS_COPY[order.data.status].text}
            </p>
            <p className="text-[18px] leading-[16px] font-bold text-text-accent">Total: {formatEthLabel(order.data.total)}</p>
            {order.data.status === 'confirmed' && order.data.txHash && order.data.explorerUrl && (
              <p className="text-[14px] leading-[24px] text-text-secondary">
                Transação (simulada): <span className="text-foreground">{shortAddress(order.data.txHash)}</span>
              </p>
            )}
            <Link
              to={order.data.status === 'rejected' ? '/cart' : '/'}
              className="flex h-[40px] items-center rounded-[6px] bg-primary px-[28px] text-[14px] leading-[20px] font-bold text-ink"
            >
              {order.data.status === 'rejected' ? 'VOLTAR AO CARRINHO' : 'CONTINUAR EXPLORANDO'}
            </Link>
          </>
        )}
      </section>
    </PageShell>
  )
}
