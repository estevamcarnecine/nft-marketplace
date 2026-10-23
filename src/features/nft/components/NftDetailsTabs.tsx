import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { shortAddress } from '@/lib/format'
import { Hairline } from '@/components/common/Hairline'
import { NETWORKS } from '@/types'
import type { NftDetail } from '@/types'
import dividerSection from '@/assets/nft-detail/divider-section.svg'
import tabUnderline from '@/assets/nft-detail/tab-underline.svg'

const TERM = 'w-full text-[14px] leading-[24px] font-bold text-foreground'
const DEFINITION = 'w-full text-[14px] leading-[24px] text-text-secondary'

export function NftDetailsTabs({ nft }: { nft: NftDetail }) {
  const network = NETWORKS.find((item) => item.id === nft.network)?.label ?? nft.network

  return (
    <section aria-label="Informações do NFT" className="flex w-full flex-col items-start gap-[12px]">
      <div className="flex w-full flex-col items-start">
        <div role="tablist" aria-label="Seções do NFT" className="flex items-start gap-[32px]">
          <div className="flex w-[161px] flex-col items-start gap-[12px]">
            <button
              type="button"
              role="tab"
              id="tab-details"
              aria-selected="true"
              aria-controls="panel-details"
              className="w-full text-left text-[17px] leading-[16px] font-bold whitespace-nowrap text-text-accent"
            >
              Detalhes do NFT
            </button>
            <span aria-hidden className="relative h-0 w-full">
              <span className="absolute inset-[-3px_0_0_0]">
                <img alt="" src={tabUnderline} className="block size-full max-w-none" />
              </span>
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="tab"
                aria-selected="false"
                aria-disabled="true"
                className="cursor-not-allowed text-[17px] leading-[16px] whitespace-nowrap text-foreground"
              >
                Avaliações de colecionadores ({nft.reviewCount})
                <span className="sr-only"> (em breve)</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Em breve</TooltipContent>
          </Tooltip>
        </div>
        <Hairline src={dividerSection} />
      </div>

      <div
        role="tabpanel"
        id="panel-details"
        aria-labelledby="tab-details"
        className="flex w-full flex-col items-start gap-[12px]"
      >
        <div className="flex w-full flex-col gap-[24px]">
          {nft.story.map((paragraph, index) => (
            <p key={index} className={DEFINITION}>
              {paragraph}
            </p>
          ))}
        </div>
        <dl className="flex w-full flex-col items-start gap-[12px]">
          <div className="w-full">
            <dt className={TERM}>Rede:</dt>
            <dd className={DEFINITION}>
              Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.
            </dd>
          </div>
          <div className="w-full">
            <dt className={TERM}>Contrato:</dt>
            <dd className={DEFINITION}>
              {shortAddress(nft.contractAddress)} • Contrato inteligente {nft.tokenStandard} verificado.
            </dd>
          </div>
          <div className="w-full">
            <dt className={TERM}>Direitos autorais:</dt>
            <dd className={DEFINITION}>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos
              mercados compatíveis.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
