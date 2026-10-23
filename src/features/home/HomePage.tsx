import { Hero } from '@/components/home/Hero'
import { PageShell } from '@/components/layout/PageShell'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { FeaturedBanner } from '@/features/catalog/components/FeaturedBanner'
import { FiltersPanel } from '@/features/catalog/components/FiltersPanel'
import { Blog } from './components/Blog'
import { Promos } from './components/Promos'

/** The Início screen (Figma 2:2). Also rendered behind the auth dialogs, as in the login frames. */
export function HomePage() {
  return (
    <PageShell active="home">
      <Hero />
      <section id="mercado" aria-labelledby="mercado-title" className="flex w-full scroll-mt-[24px] items-start gap-[48px]">
        <h2 id="mercado-title" className="sr-only">
          Mercado
        </h2>
        <div className="flex shrink-0 flex-col items-start gap-[24px]">
          <FiltersPanel />
          <FeaturedBanner />
        </div>
        <CatalogGrid />
      </section>
      <Promos />
      <Blog />
    </PageShell>
  )
}
