import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="text-[43px] font-bold leading-[70px]">
        SEJA DONO DO FUTURO DA ARTE DIGITAL
      </h1>
    </main>
  )
}