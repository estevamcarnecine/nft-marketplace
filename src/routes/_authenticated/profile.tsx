import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/profile')({
  component: () => (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="text-[24px] font-bold">Perfil do Colecionador</h1>
    </main>
  ),
})