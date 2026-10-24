import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { orderQuery } from '@/features/checkout/api'
import { OrderReceipt } from '@/features/orders/components/OrderReceipt'
import { useRealtimeConnected } from '@/features/realtime/status'
import { isApiError } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  component: OrderPage,
})

const PENDING_POLL_MS = 1500

function OrderPage() {
  const { orderId } = Route.useParams()
  const navigate = useNavigate()
  const realtime = useRealtimeConnected()
  const order = useQuery({
    ...orderQuery(orderId),
    refetchInterval: (query) => (!realtime && query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })

  const notFound = isApiError(order.error) && order.error.status === 404
  const error = order.isError ? (
    <>
      <p role="alert" className="text-[16px] leading-[22px] font-bold text-foreground">
        {notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
      </p>
      <p className="text-[14px] leading-[22px] text-text-secondary">
        {notFound
          ? 'Este pedido não existe ou pertence a outra conta.'
          : 'Verifique sua conexão. O pedido não é afetado: tente novamente.'}
      </p>
      {notFound ? (
        <Link to="/" className="rounded-[5px] bg-primary p-[16px] text-[16px] leading-[16px] font-bold text-ink">
          Voltar ao início
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void order.refetch()}
          className="rounded-[5px] bg-primary p-[16px] text-[16px] leading-[16px] font-bold text-ink"
        >
          Tentar novamente
        </button>
      )}
    </>
  ) : null

  return (
    <OrderReceipt
      order={order.data}
      error={error}
      onClose={() => void navigate({ to: order.data?.status === 'rejected' ? '/cart' : '/' })}
    />
  )
}
