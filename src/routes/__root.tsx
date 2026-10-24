import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

import { PageShell } from '@/components/layout/PageShell'
import { SessionWatcher } from '@/features/auth/components/SessionWatcher'
import { RealtimeProvider } from '@/features/realtime/RealtimeProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
      <Toaster position="bottom-right" />
      <RealtimeProvider />
      <SessionWatcher />
    </TooltipProvider>
  ),
  notFoundComponent: () => (
    <PageShell active="home">
      <section className="flex min-h-[448px] w-full flex-col items-start justify-center gap-[16px] rounded-[6px] bg-surface-card p-[40px] max-sm:min-h-0 max-sm:p-[20px]">
        <h1 className="text-[28px] leading-[normal] font-bold text-foreground">Página não encontrada</h1>
        <p className="text-[14px] leading-[24px] text-text-secondary">O endereço acessado não existe.</p>
        <Link
          to="/"
          className="flex h-[40px] items-center rounded-[6px] bg-primary px-[28px] text-[14px] leading-[20px] font-bold text-ink"
        >
          VOLTAR AO INÍCIO
        </Link>
      </section>
    </PageShell>
  ),
})
