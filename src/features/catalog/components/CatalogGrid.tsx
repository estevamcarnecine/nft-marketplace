import { useQuery } from '@tanstack/react-query'
import { Select } from 'radix-ui'
import { cn } from 'cn'

import { catalogQuery, toCatalogParams } from '../api'
import { SORTS, TABS } from '../search'
import { useCatalogSearch } from '../use-catalog-search'
import { ProductCard, ProductCardSkeleton } from './ProductCard'
import pageArrow from '@/assets/catalog/page-arrow.svg'
import sortArrow from '@/assets/catalog/sort-arrow.svg'
import tabUnderline from '@/assets/catalog/tab-underline.svg'

const PAGE_BUTTON = 'flex size-[35px] items-center justify-center rounded-[4px] text-[18px] leading-[16px]'

function Toolbar() {
  const { search, update } = useCatalogSearch()
  const tab = search.tab ?? 'all'
  const sort = search.sort ?? (tab === 'trending' ? 'trending' : 'recent')

  return (
    <div className="relative flex w-full items-center justify-between">
      <div role="tablist" aria-label="Listagens" className="flex items-start gap-[20px] overflow-clip text-[15px] leading-[16px] font-medium whitespace-nowrap">
        {TABS.map((item) => {
          const active = item.id === tab
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="catalog-results"
              onClick={() => update({ tab: item.id === 'all' ? undefined : item.id, sort: undefined })}
              className={cn('relative', active ? 'text-text-accent' : 'text-foreground hover:text-text-accent')}
            >
              {item.label}
              {active && (
                <span aria-hidden className="absolute inset-x-0 top-[23px] h-0">
                  <span className="absolute inset-[-2px_0_0_0]">
                    <img alt="" src={tabUnderline} className="block size-full max-w-none" />
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Select.Root value={sort} onValueChange={(next) => update({ sort: SORTS.find((item) => item.id === next)?.id })}>
        <Select.Trigger
          aria-label={`Ordenar por: ${SORTS.find((item) => item.id === sort)?.label}`}
          className="relative h-[18px] w-[300px] text-left text-[15px] leading-[normal] whitespace-nowrap text-foreground outline-none"
        >
          <span aria-hidden className="absolute top-0 left-0">
            Ordenar por:
          </span>
          <span className="absolute top-0 left-[110px]">
            <Select.Value />
          </span>
          <Select.Icon asChild>
            <span aria-hidden className="absolute top-[2px] left-[278px] size-[16px]">
              <span className="absolute inset-[35.42%_20.83%]">
                <span className="absolute inset-[-16.07%_-8.04%]">
                  <img alt="" src={sortArrow} className="block size-full max-w-none" />
                </span>
              </span>
            </span>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content position="popper" align="end" sideOffset={8} className="z-50 rounded-[4px] border border-border bg-surface-card p-[4px]">
            <Select.Viewport>
              {SORTS.map((item) => (
                <Select.Item
                  key={item.id}
                  value={item.id}
                  className="cursor-pointer rounded-[3px] px-[10px] py-[10px] text-[15px] leading-[16px] text-foreground outline-none data-[highlighted]:bg-surface-dark data-[state=checked]:text-text-accent"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

function pageWindow(current: number, total: number): number[] {
  const size = Math.min(4, total)
  const start = Math.min(Math.max(1, current - 1), total - size + 1)
  return Array.from({ length: size }, (_, index) => start + index)
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { goToPage } = useCatalogSearch()
  if (totalPages <= 1) return null

  function go(target: number) {
    goToPage(target)
    document.getElementById('mercado')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <nav aria-label="Paginação" className="flex items-center gap-[8px]">
      {page > 1 && (
        <button type="button" onClick={() => go(page - 1)} aria-label="Página anterior" className={cn(PAGE_BUTTON, 'border border-border')}>
          <img alt="" src={pageArrow} className="block h-[6.75px] w-[12px] max-w-none rotate-90" />
        </button>
      )}
      {pageWindow(page, totalPages).map((target) => (
        <button
          key={target}
          type="button"
          onClick={() => go(target)}
          aria-label={`Página ${target}`}
          aria-current={target === page ? 'page' : undefined}
          className={cn(
            PAGE_BUTTON,
            target === page ? 'bg-primary font-bold text-ink' : 'border border-border pt-[8px] pb-[10px] text-foreground hover:border-primary',
          )}
        >
          {target}
        </button>
      ))}
      {page < totalPages && (
        <button type="button" onClick={() => go(page + 1)} aria-label="Próxima página" className={cn(PAGE_BUTTON, 'border border-border')}>
          <img alt="" src={pageArrow} className="block h-[6.75px] w-[12px] max-w-none -rotate-90" />
        </button>
      )}
    </nav>
  )
}

export function CatalogGrid() {
  const { search, update, reset } = useCatalogSearch()
  const list = useQuery(catalogQuery(toCatalogParams(search)))
  const page = list.data?.page ?? search.page ?? 1
  const filtered = Boolean(search.q || search.collections || search.networks || search.minPrice || search.maxPrice || search.tab)

  return (
    <div className="flex min-w-px flex-1 flex-col items-end gap-[88px]">
      <div className="flex w-full flex-col items-start gap-[32px]">
        <Toolbar />

        {search.q && (
          <p className="-mt-[12px] flex items-center gap-[12px] text-[14px] leading-[20px] text-text-secondary">
            Resultados para “<span className="text-foreground">{search.q}</span>”
            <button type="button" onClick={() => update({ q: undefined })} className="font-bold text-text-accent underline">
              Limpar busca
            </button>
          </p>
        )}

        <div id="catalog-results" role="tabpanel" aria-live="polite" aria-busy={list.isFetching} className="w-full">
          {list.isPending ? (
            <ul aria-label="Carregando NFTs" className="grid w-full grid-cols-3 justify-between gap-x-[34px] gap-y-[72px]">
              {Array.from({ length: 9 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </ul>
          ) : list.isError && !list.data ? (
            <div role="alert" className="flex min-h-[300px] w-full flex-col items-start justify-center gap-[16px] bg-surface-card p-[40px]">
              <p className="text-[18px] leading-[24px] font-bold text-foreground">Não foi possível carregar os NFTs.</p>
              <p className="text-[14px] leading-[22px] text-text-secondary">Verifique sua conexão e tente novamente.</p>
              <button type="button" onClick={() => void list.refetch()} className="rounded-[6px] bg-primary px-[20px] py-[10px] text-[14px] leading-[20px] font-bold text-ink">
                Tentar novamente
              </button>
            </div>
          ) : list.data && list.data.items.length === 0 ? (
            <div className="flex min-h-[300px] w-full flex-col items-start justify-center gap-[16px] bg-surface-card p-[40px]">
              <p className="text-[18px] leading-[24px] font-bold text-foreground">Nenhum NFT encontrado</p>
              <p className="text-[14px] leading-[22px] text-text-secondary">
                {filtered ? 'Tente outra busca ou remova alguns filtros.' : 'Ainda não há NFTs listados no mercado.'}
              </p>
              {filtered && (
                <button type="button" onClick={reset} className="rounded-[6px] bg-primary px-[20px] py-[10px] text-[14px] leading-[20px] font-bold text-ink">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="sr-only">{list.data?.total} NFTs encontrados. Página {page} de {list.data?.totalPages}.</p>
              <ul
                aria-label="NFTs"
                className={cn(
                  'grid w-full grid-cols-3 justify-between gap-x-[34px] gap-y-[72px] transition-opacity motion-reduce:transition-none',
                  list.isPlaceholderData && 'opacity-60',
                )}
              >
                {list.data?.items.map((nft, index) => (
                  <ProductCard key={nft.id} nft={nft} eager={index < 3} firstRow={index < 3} />
                ))}
              </ul>
              {list.isError && (
                <p role="alert" className="mt-[16px] text-[14px] leading-[20px] text-text-secondary">
                  Não foi possível atualizar a lista.{' '}
                  <button type="button" onClick={() => void list.refetch()} className="font-bold text-text-accent underline">
                    Tentar novamente
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {list.data && <Pagination page={page} totalPages={list.data.totalPages} />}
    </div>
  )
}
