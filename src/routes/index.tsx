import { createFileRoute } from '@tanstack/react-router'

import { catalogSearchSchema } from '@/features/catalog/search'
import { HomePage } from '@/features/home/HomePage'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})
