import type { ComponentProps } from 'react'

const WIDTHS = [160, 320, 640, 960]
const ARTWORK = /^\/nft\/([a-z0-9-]+)\.png$/

function srcSet(name: string, format: 'avif' | 'webp'): string {
  return WIDTHS.map((width) => `/nft/opt/${name}-${width}.${format} ${width}w`).join(', ')
}

export function NftImage({ src, sizes, ...img }: ComponentProps<'img'> & { src: string; sizes: string }) {
  const name = ARTWORK.exec(src)?.[1]
  if (!name) return <img src={src} {...img} />
  return (
    <picture className="contents">
      <source hidden type="image/avif" srcSet={srcSet(name, 'avif')} sizes={sizes} />
      <source hidden type="image/webp" srcSet={srcSet(name, 'webp')} sizes={sizes} />
      <img src={src} decoding="async" {...img} />
    </picture>
  )
}
