import { z } from 'zod'
import { CATALOG_SORTS, CATALOG_TABS, COLLECTIONS, NETWORKS } from '@/types'

const collectionIds = COLLECTIONS.map((collection) => collection.id) as [string, ...string[]]
const networkIds = NETWORKS.map((network) => network.id) as [string, ...string[]]
const ethAmount = z.string().regex(/^\d+(\.\d{1,18})?$/)

/** Catalog state that lives in the URL of `/`. Invalid values are dropped instead of failing the route. */
export const catalogSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  tab: z.enum(CATALOG_TABS).optional().catch(undefined),
  collections: z.array(z.enum(collectionIds)).optional().catch(undefined),
  networks: z.array(z.enum(networkIds)).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  sort: z.enum(CATALOG_SORTS).optional().catch(undefined),
  page: z.number().int().min(2).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>
