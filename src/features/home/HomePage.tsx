import { useRef } from 'react'

import { Hero } from '@/components/home/Hero'
import { MobileShell } from '@/components/layout/MobileShell'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { PageShell } from '@/components/layout/PageShell'
import { CatalogGrid } from '@/features/catalog/components/CatalogGrid'
import { FeaturedBanner } from '@/features/catalog/components/FeaturedBanner'
import { FiltersPanel } from '@/features/catalog/components/FiltersPanel'
import { MobileCatalog, MobileSearchBar } from '@/features/catalog/components/MobileCatalog'
import { useIsDesktop } from '@/lib/use-media-query'
import { Blog } from './components/Blog'
import { MobileHero } from './components/MobileHero'
import { Promos } from './components/Promos'

/** The Início screen (Figma 2:2). Also rendered behind the auth dialogs, as in the login frames. */
function DesktopHome() {
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

/** Figma "Mobile / Início" (14:5226): search, hero, tabs, product grid and the tab bar. */
function MobileHome() {
  const searchRef = useRef<HTMLInputElement>(null)

  function focusSearch() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    searchRef.current?.focus()
  }

  return (
    <>
      {/* Room for the fixed tab bar. */}
      <MobileShell className="pb-[calc(150px+env(safe-area-inset-bottom))]">
        <main id="conteudo" className="flex w-full flex-col items-start gap-[16px]">
          <MobileSearchBar inputRef={searchRef} />
          <MobileHero />
          <MobileCatalog />
        </main>
      </MobileShell>
      <MobileTabBar onSearch={focusSearch} />
    </>
  )
}

export function HomePage() {
  return useIsDesktop() ? <DesktopHome /> : <MobileHome />
}
