import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { PageShell } from '@/components/layout/PageShell'
import { explorerTxQuery } from '@/features/checkout/api'
import { isApiError } from '@/lib/api'
import { formatEthLabel, shortAddress } from '@/lib/format'
import { NETWORKS } from '@/types'

export const Route = createFileRoute('/explorer/tx/$hash')({
  component: ExplorerPage,
})

function ExplorerPage() {
  const { hash } = Route.useParams()
  const tx = useQuery(explorerTxQuery(hash))

  return (
    <PageShell active="market">
      <section className="flex w-full flex-col items-start gap-[16px] rounded-[6px] bg-surface-card p-[40px] max-sm:p-[20px]">
        <p className="text-[14px] leading-[16px] font-medium tracking-[1.4px] text-text-secondary">
          Explorador de blocos simulado
        </p>
        <h1 className="text-[28px] leading-[normal] font-bold text-foreground max-sm:text-[22px]">
          Detalhes da transação
        </h1>
        <p className="text-[14px] leading-[22px] text-text-secondary">
          Esta demonstração não usa uma blockchain real: os dados abaixo vêm da simulação.
        </p>
        {tx.isPending ? (
          <p aria-busy="true" className="text-[14px] text-text-secondary">
            Carregando transação…
          </p>
        ) : tx.isError ? (
          <p role="alert" className="text-[14px] text-text-secondary">
            {isApiError(tx.error) && tx.error.status === 404
              ? 'Transação não encontrada.'
              : 'Não foi possível carregar a transação.'}
          </p>
        ) : (
          <dl className="grid w-full grid-cols-[180px_1fr] max-sm:grid-cols-[112px_1fr] max-sm:gap-x-[12px] gap-x-[24px] gap-y-[12px] text-[15px] leading-[22px]">
            <dt className="text-text-secondary">Hash</dt>
            <dd className="break-all text-foreground">{tx.data.hash}</dd>
            <dt className="text-text-secondary">Status</dt>
            <dd className="font-bold text-text-accent">Confirmada</dd>
            <dt className="text-text-secondary">Rede</dt>
            <dd className="text-foreground">{NETWORKS.find((network) => network.id === tx.data.network)?.label}</dd>
            <dt className="text-text-secondary">Bloco</dt>
            <dd className="text-foreground">{tx.data.blockNumber.toLocaleString('pt-BR')}</dd>
            <dt className="text-text-secondary">De</dt>
            <dd className="text-foreground" title={tx.data.from}>
              {shortAddress(tx.data.from)}
            </dd>
            <dt className="text-text-secondary">Para</dt>
            <dd className="text-foreground" title={tx.data.to}>
              {shortAddress(tx.data.to)}
            </dd>
            <dt className="text-text-secondary">Valor</dt>
            <dd className="text-foreground">{formatEthLabel(tx.data.value)}</dd>
            <dt className="text-text-secondary">NFTs transferidos</dt>
            <dd className="text-foreground">{tx.data.itemCount}</dd>
            <dt className="text-text-secondary">Data</dt>
            <dd className="text-foreground">{new Date(tx.data.timestamp).toLocaleString('pt-BR')}</dd>
          </dl>
        )}
        <Link
          to="/"
          className="mt-[8px] rounded-[5px] bg-primary p-[16px] text-[16px] leading-[16px] font-bold text-ink"
        >
          Voltar ao início
        </Link>
      </section>
    </PageShell>
  )
}
