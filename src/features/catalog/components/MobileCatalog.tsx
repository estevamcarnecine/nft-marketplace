import { useState, type Ref } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from 'cn'

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { catalogQuery, toCatalogParams } from '../api'
import { useCatalogSearch } from '../use-catalog-search'
import { SORTS, TABS } from '../search'
import { Pagination } from './CatalogGrid'
import { FiltersPanel } from './FiltersPanel'
import { MobileProductCard, MobileProductCardSkeleton } from './MobileProductCard'
import filterIcon from '@/assets/mobile/home/filter.svg'
import searchIcon from '@/assets/mobile/home/search.svg'
import tabUnderline from '@/assets/mobile/home/tab-underline.svg'

const FILTER_BUTTON = 'linear-gradient(137.05deg, rgba(210, 138, 76, 0.45) 24.6%, #d28a4c 100%)'
const GRID = 'grid w-full grid-cols-2 gap-x-[16px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4 max-md:pb-[32px]'
const PANEL_BUTTON = 'rounded-[6px] bg-primary px-[20px] py-[10px] text-[14px] leading-[20px] font-bold text-ink'

export function MobileSearchBar({ inputRef }: { inputRef?: Ref<HTMLInputElement> }) {
  const { search, update } = useCatalogSearch()
  const [term, setTerm] = useState(search.q ?? '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const tab = search.tab ?? 'all'
  const sort = search.sort ?? (tab === 'trending' ? 'trending' : 'recent')
  const active = [search.collections?.length, search.networks?.length, search.minPrice, search.maxPrice].filter(
    Boolean,
  ).length

  return (
    <div className="flex h-[45px] w-full items-start gap-[8px]">
      <form
        role="search"
        className="flex h-[45px] min-w-px flex-1 items-center gap-[8px] rounded-[10px] bg-surface-card px-[12px]"
        onSubmit={(event) => {
          event.preventDefault()
          update({ q: term.trim() || undefined })
          event.currentTarget.querySelector('input')?.blur()
        }}
      >
        <img alt="" src={searchIcon} className="block size-[22px] shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          aria-label="Buscar NFTs"
          enterKeyHint="search"
          className="min-w-px flex-1 bg-transparent text-[14px] leading-[16px] font-bold text-foreground outline-none placeholder:text-secondary"
        />
      </form>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger
          aria-label={active ? `Filtros e ordenação, ${active} ativos` : 'Filtros e ordenação'}
          className="relative flex size-[45px] shrink-0 items-center justify-center rounded-[14px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          style={{ backgroundImage: FILTER_BUTTON }}
        >
          <img
            alt=""
            src={filterIcon}
            className="absolute top-[15.53px] left-[15.53px] block h-[16.107px] w-[16.146px] max-w-none"
          />
          {active > 0 && (
            <span
              aria-hidden
              className="absolute -top-[4px] -right-[4px] flex size-[16px] items-center justify-center rounded-full bg-text-accent text-[10px] font-medium text-ink"
            >
              {active}
            </span>
          )}
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-[20px] overflow-y-auto rounded-t-[20px] border-border bg-background px-[24px] pt-[24px] pb-[calc(24px+env(safe-area-inset-bottom))] md:mx-auto md:max-w-[560px]"
        >
          <div className="flex flex-col gap-[4px]">
            <SheetTitle className="text-[18px] leading-[24px] font-bold text-foreground">
              Filtros e ordenação
            </SheetTitle>
            <SheetDescription className="text-[13px] leading-[18px] text-text-secondary">
              A lista é atualizada a cada mudança.
            </SheetDescription>
          </div>

          <fieldset className="flex flex-col gap-[8px]">
            <legend className="mb-[8px] text-[16px] leading-[16px] font-bold text-foreground">Ordenar por</legend>
            {SORTS.map((item) => (
              <label
                key={item.id}
                className="flex min-h-[40px] cursor-pointer items-center gap-[12px] text-[14px] leading-[16px] text-foreground"
              >
                <input
                  type="radio"
                  name="mobile-sort"
                  checked={sort === item.id}
                  onChange={() => update({ sort: item.id })}
                  className="size-[16px] accent-primary"
                />
                {item.label}
              </label>
            ))}
          </fieldset>

          <FiltersPanel className="w-full rounded-[12px] p-[16px]" />

          <button type="button" onClick={() => setFiltersOpen(false)} className={cn(PANEL_BUTTON, 'h-[48px] w-full')}>
            Ver resultados
          </button>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function MobileCatalog() {
  const { search, update, reset } = useCatalogSearch()
  const list = useQuery(catalogQuery(toCatalogParams(search)))
  const tab = search.tab ?? 'all'
  const page = list.data?.page ?? search.page ?? 1
  const filtered = Boolean(
    search.q || search.collections || search.networks || search.minPrice || search.maxPrice || search.tab,
  )

  return (
    <section
      id="mercado"
      aria-labelledby="mercado-title"
      className="flex w-full scroll-mt-[16px] flex-col items-start gap-[16px]"
    >
      <h2 id="mercado-title" className="sr-only">
        Mercado
      </h2>
      <div
        role="tablist"
        aria-label="Listagens"
        className="flex w-full items-start gap-[16px] overflow-x-auto text-[14px] leading-[16px] whitespace-nowrap [scrollbar-width:none]"
      >
        {TABS.map((item) => {
          const selected = item.id === tab
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="catalog-results"
              onClick={() => update({ tab: item.id === 'all' ? undefined : item.id, sort: undefined })}
              className={cn(
                'flex flex-col gap-[4px] pb-[2px] first:-mr-[12px]',
                selected ? 'font-bold text-text-accent' : 'text-foreground',
              )}
            >
              {item.label}
              <span aria-hidden className={cn('relative h-0 w-full', !selected && 'invisible')}>
                <span className="absolute inset-[-2px_0_0_0]">
                  <img alt="" src={tabUnderline} className="block size-full max-w-none" />
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {search.q && (
        <p className="flex flex-wrap items-center gap-x-[12px] text-[13px] leading-[20px] text-text-secondary">
          <span>
            Resultados para “<span className="text-foreground">{search.q}</span>”
          </span>
          <button
            type="button"
            onClick={() => update({ q: undefined })}
            className="font-bold text-text-accent underline"
          >
            Limpar busca
          </button>
        </p>
      )}

      <div id="catalog-results" role="tabpanel" aria-live="polite" aria-busy={list.isFetching} className="w-full">
        {list.isPending ? (
          <ul aria-label="Carregando NFTs" className={GRID}>
            {Array.from({ length: 4 }, (_, index) => (
              <MobileProductCardSkeleton key={index} />
            ))}
          </ul>
        ) : list.isError && !list.data ? (
          <div
            role="alert"
            className="flex w-full flex-col items-start gap-[12px] rounded-[12px] bg-surface-card p-[20px]"
          >
            <p className="text-[16px] leading-[22px] font-bold text-foreground">Não foi possível carregar os NFTs.</p>
            <p className="text-[13px] leading-[20px] text-text-secondary">Verifique sua conexão e tente novamente.</p>
            <button type="button" onClick={() => void list.refetch()} className={PANEL_BUTTON}>
              Tentar novamente
            </button>
          </div>
        ) : list.data && list.data.items.length === 0 ? (
          <div className="flex w-full flex-col items-start gap-[12px] rounded-[12px] bg-surface-card p-[20px]">
            <p className="text-[16px] leading-[22px] font-bold text-foreground">Nenhum NFT encontrado</p>
            <p className="text-[13px] leading-[20px] text-text-secondary">
              {filtered ? 'Tente outra busca ou remova alguns filtros.' : 'Ainda não há NFTs listados no mercado.'}
            </p>
            {filtered && (
              <button type="button" onClick={reset} className={PANEL_BUTTON}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="sr-only">
              {list.data?.total} NFTs encontrados. Página {page} de {list.data?.totalPages}.
            </p>
            <ul
              aria-label="NFTs"
              className={cn(
                GRID,
                'transition-opacity motion-reduce:transition-none',
                list.isPlaceholderData && 'opacity-60',
              )}
            >
              {list.data?.items.map((nft, index) => (
                <MobileProductCard key={nft.id} nft={nft} eager={index < 2} />
              ))}
            </ul>
            {list.isError && (
              <p role="alert" className="mt-[16px] text-[13px] leading-[20px] text-text-secondary">
                Não foi possível atualizar a lista.{' '}
                <button
                  type="button"
                  onClick={() => void list.refetch()}
                  className="font-bold text-text-accent underline"
                >
                  Tentar novamente
                </button>
              </p>
            )}
          </>
        )}
      </div>

      {list.data && (
        <div className="flex w-full justify-center pt-[8px]">
          <Pagination page={page} totalPages={list.data.totalPages} />
        </div>
      )}
    </section>
  )
}
