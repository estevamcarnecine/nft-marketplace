import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { id } = Route.useParams()
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="text-[24px] font-bold">NFT {id}</h1>
    </main>
  )
}