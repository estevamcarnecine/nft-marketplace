import { useNavigate, useSearch } from '@tanstack/react-router'

import { catalogSearchSchema, type CatalogSearch } from './search'

function clean(search: CatalogSearch): CatalogSearch {
  const next: CatalogSearch = { ...search }
  if (!next.collections?.length) delete next.collections
  if (!next.networks?.length) delete next.networks
  if (!next.q) delete next.q
  if (!next.page || next.page < 2) delete next.page
  for (const key of Object.keys(next) as (keyof CatalogSearch)[]) {
    if (next[key] === undefined) delete next[key]
  }
  return next
}

/**
 * The catalog state lives in the URL of `/` (search, filters, sort, page), so it survives refreshes
 * and history navigation. Any filter change returns to the first page. The home page is also drawn
 * behind the auth dialogs, so the URL is read non-strictly and narrowed by the catalog schema.
 */
export function useCatalogSearch() {
  const raw = useSearch({ strict: false })
  const search = catalogSearchSchema.parse(raw)
  const navigate = useNavigate()

  function update(patch: Partial<CatalogSearch>) {
    void navigate({ to: '/', search: (previous) => clean({ ...catalogSearchSchema.parse(previous), ...patch, page: undefined }), resetScroll: false })
  }

  function goToPage(page: number) {
    void navigate({ to: '/', search: (previous) => clean({ ...catalogSearchSchema.parse(previous), page }), resetScroll: false })
  }

  function reset() {
    void navigate({ to: '/', search: {}, resetScroll: false })
  }

  return { search, update, goToPage, reset }
}
