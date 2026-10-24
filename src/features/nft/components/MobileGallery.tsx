import { useRef, useState } from 'react'
import { cn } from 'cn'

import { NftImage } from '@/components/common/NftImage'

export function MobileGallery({ name, images }: { name: string; images: string[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)

  function show(index: number) {
    const element = track.current
    if (!element) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({ left: index * element.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
    setSelected(index)
  }

  return (
    <div className="relative h-[356px] w-full">
      <div
        ref={track}
        aria-label={`Imagens de ${name}`}
        onScroll={(event) => {
          const element = event.currentTarget
          setSelected(Math.round(element.scrollLeft / Math.max(1, element.clientWidth)))
        }}
        className="flex size-full snap-x snap-mandatory overflow-x-auto rounded-[24px] [scrollbar-width:none]"
      >
        {images.map((image, index) => (
          <NftImage
            key={index}
            alt={index === 0 ? name : `${name}, imagem ${index + 1}`}
            src={image}
            sizes="(min-width: 560px) 504px, calc(100vw - 56px)"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            loading={index === 0 ? 'eager' : 'lazy'}
            className="block h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Imagens do NFT"
          className="absolute top-[290px] left-1/2 flex -translate-x-1/2 items-center gap-[12px] rounded-full bg-ink/60 px-[10px] py-[6px]"
        >
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => show(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === selected}
              className={cn(
                'relative size-[8px] rounded-full border border-primary before:absolute before:-inset-[8px] before:content-[""]',
                index === selected && 'bg-primary',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
