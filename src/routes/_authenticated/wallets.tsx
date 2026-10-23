import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/wallets')({
  component: () => (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="text-[24px] font-bold">Carteiras</h1>
    </main>
  ),
})