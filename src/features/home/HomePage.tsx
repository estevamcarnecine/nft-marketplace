import { Hero } from '@/components/home/Hero'
import { PageShell } from '@/components/layout/PageShell'

/** The Início screen. Also rendered behind the auth dialogs, as in the Figma login frames. */
export function HomePage() {
  return (
    <PageShell active="home">
      <Hero />
    </PageShell>
  )
}
