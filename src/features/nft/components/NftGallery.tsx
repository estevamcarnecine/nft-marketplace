import { useState } from 'react'
import { cn } from 'cn'

import { NftImage } from '@/components/common/NftImage'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import zoomIcon from '@/assets/nft-detail/zoom.svg'

export function NftGallery({ name, images }: { name: string; images: string[] }) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]

  return (
    <div className="relative flex h-[448px] w-[573px] shrink-0 items-center gap-[28px]">
      <ul aria-label="Imagens do NFT" className="flex w-[100px] shrink-0 flex-col items-start gap-[16px]">
        {images.map((image, index) => (
          <li key={index} className="size-[100px] rounded-[6px] bg-surface-card">
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === selected}
              className={cn(
                'relative block size-full rounded-[8px]',
                index === selected && 'border border-primary',
              )}
            >
              <NftImage
                alt=""
                src={image}
                sizes="100px"
                width={100}
                height={100}
                className="pointer-events-none absolute inset-0 size-full max-w-none rounded-[8px] object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex size-[444px] shrink-0 items-center justify-center rounded-[6px] bg-surface-card p-[16px]">
        <NftImage
          alt={name}
          src={current}
          sizes="404px"
          width={404}
          height={404}
          fetchPriority="high"
          className="size-[404px] max-w-none rounded-[24px] object-cover"
        />
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="Ampliar imagem"
            className="absolute top-[15px] left-[530px] size-[30px] rounded-full"
          >
            <img alt="" src={zoomIcon} className="absolute inset-0 block size-full max-w-none" />
          </button>
        </DialogTrigger>
        <DialogContent className="w-auto max-w-[min(90vw,720px)] border-border bg-surface-card p-[16px] sm:max-w-[min(90vw,720px)]">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <NftImage alt={name} src={current} sizes="min(90vw, 720px)" className="max-h-[80vh] w-full rounded-[24px] object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
