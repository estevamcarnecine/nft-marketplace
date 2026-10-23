import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Slider } from 'radix-ui'
import { cn } from 'cn'

import { Skeleton } from '@/components/ui/skeleton'
import type { CollectionId, NetworkId } from '@/types'
import { facetsQuery } from '../api'
import { useCatalogSearch } from '../use-catalog-search'

const HEADING = 'text-[18px] leading-[16px] font-bold whitespace-nowrap text-foreground'

/** Prices travel as decimal strings; the slider works on integer hundredths (0.01 ETH steps). */
function toHundredths(eth: string): number {
  const [whole, fraction = ''] = eth.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2))
}

function fromHundredths(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`
}

function formatBrl(value: number): string {
  return fromHundredths(value).replace('.', ',')
}

function toggle<T>(list: T[] | undefined, value: T): T[] {
  const current = list ?? []
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

function FilterRow({
  label,
  count,
  checked,
  boldCount,
  onToggle,
}: {
  label: string
  count: number
  checked: boolean
  boldCount: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        'flex w-full items-start justify-between text-left text-[15px] leading-[40px] whitespace-nowrap',
        checked ? 'text-text-accent' : 'text-text-secondary hover:text-foreground',
      )}
    >
      <span className={cn(checked && 'underline decoration-1 underline-offset-4')}>{label}</span>
      <span className={cn('text-right', boldCount && 'font-bold')}>
        <span className="sr-only">, </span>({count})<span className="sr-only"> NFTs</span>
      </span>
    </button>
  )
}

function PriceFilter({ min, max }: { min: string; max: string }) {
  const { search, update } = useCatalogSearch()
  const bounds: [number, number] = [toHundredths(min), toHundredths(max)]
  const applied: [number, number] = [
    search.minPrice ? toHundredths(search.minPrice) : bounds[0],
    search.maxPrice ? toHundredths(search.maxPrice) : bounds[1],
  ]
  const [draft, setDraft] = useState<{ key: string; value: [number, number] }>({ key: applied.join('-'), value: applied })
  // A new URL (history, reset) replaces whatever was being dragged.
  const value = draft.key === applied.join('-') ? draft.value : applied

  function apply() {
    update({
      minPrice: value[0] > bounds[0] ? fromHundredths(value[0]) : undefined,
      maxPrice: value[1] < bounds[1] ? fromHundredths(value[1]) : undefined,
    })
  }

  return (
    <div role="group" aria-labelledby="price-filter-title" className="flex w-full flex-col items-start gap-[12px] overflow-clip">
      <h3 id="price-filter-title" className={HEADING}>
        Faixa de preço
      </h3>
      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip pl-[12px]">
        <Slider.Root
          min={bounds[0]}
          max={bounds[1]}
          step={1}
          minStepsBetweenThumbs={1}
          value={value}
          onValueChange={(next) => setDraft({ key: applied.join('-'), value: [next[0], next[1]] })}
          className="relative flex h-[21px] w-full touch-none items-center select-none"
        >
          <Slider.Track className="relative h-[4px] grow bg-primary/40">
            <Slider.Range className="absolute h-full bg-primary" />
          </Slider.Track>
          {(['Preço mínimo', 'Preço máximo'] as const).map((label, index) => (
            <Slider.Thumb
              key={label}
              aria-label={label}
              aria-valuetext={`${formatBrl(value[index])} ETH`}
              className="block size-[21px] rounded-full border-[3px] border-ink bg-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
            />
          ))}
        </Slider.Root>
        <p aria-live="polite" className="text-[15px] leading-[normal] whitespace-nowrap text-foreground">
          Preço: {formatBrl(value[0])} - {formatBrl(value[1])} ETH
        </p>
        <button
          type="button"
          onClick={apply}
          className="flex items-center overflow-clip rounded-[6px] bg-primary px-[12px] py-[8px] text-[16px] leading-[20px] font-bold whitespace-nowrap text-ink"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

/** Sidebar on desktop; inside the filters sheet on mobile, where it fills the sheet width. */
export function FiltersPanel({ className }: { className?: string }) {
  const facets = useQuery(facetsQuery)
  const { search, update } = useCatalogSearch()

  return (
    <section aria-label="Filtros" className={cn('flex w-[310px] shrink-0 flex-col items-start overflow-clip bg-surface-card p-[20px]', className)}>
      <div className="flex w-full flex-col items-start gap-[40px]">
        <div role="group" aria-labelledby="collections-filter-title" className="flex w-full flex-col items-start gap-[12px] overflow-clip">
          <h3 id="collections-filter-title" className={HEADING}>
            Coleções
          </h3>
          <div className="flex w-full flex-col items-start overflow-clip px-[12px]">
            {facets.data
              ? facets.data.collections.map((collection) => (
                  <FilterRow
                    key={collection.id}
                    label={collection.label}
                    count={collection.count}
                    boldCount
                    checked={search.collections?.includes(collection.id) ?? false}
                    onToggle={() => update({ collections: toggle<CollectionId>(search.collections, collection.id) })}
                  />
                ))
              : Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="my-[12px] h-[16px] w-full" />)}
          </div>
        </div>

        {facets.data ? (
          <PriceFilter key={`${facets.data.price.min}-${facets.data.price.max}`} min={facets.data.price.min} max={facets.data.price.max} />
        ) : (
          <Skeleton className="h-[117px] w-full" />
        )}

        <div role="group" aria-labelledby="networks-filter-title" className="flex w-full flex-col items-start gap-[12px] overflow-clip">
          <h3 id="networks-filter-title" className={HEADING}>
            Rede
          </h3>
          <div className="flex w-full flex-col items-start overflow-clip pl-[12px]">
            {facets.data
              ? facets.data.networks.map((network) => (
                  <FilterRow
                    key={network.id}
                    label={network.label}
                    count={network.count}
                    boldCount={false}
                    checked={search.networks?.includes(network.id) ?? false}
                    onToggle={() => update({ networks: toggle<NetworkId>(search.networks, network.id) })}
                  />
                ))
              : Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="my-[12px] h-[16px] w-full" />)}
          </div>
        </div>
        {facets.isError && (
          <p role="alert" className="text-[13px] leading-[18px] text-text-secondary">
            Não foi possível carregar os filtros.{' '}
            <button type="button" onClick={() => void facets.refetch()} className="font-bold text-text-accent underline">
              Tentar novamente
            </button>
          </p>
        )}
      </div>
    </section>
  )
}
