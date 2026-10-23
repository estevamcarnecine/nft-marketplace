import { createFileRoute } from '@tanstack/react-router'

import { Hero } from '@/components/home/Hero'
import { PageShell } from '@/components/layout/PageShell'
import { catalogSearchSchema } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

function HomePage() {
  return (
    <PageShell active="home">
      <Hero />
    </PageShell>
  )
}
