import type { ComponentProps } from 'react'

// Must match scripts/optimize-images.mjs.
const WIDTHS = [160, 320, 640, 960]
const ARTWORK = /^\/nft\/([a-z0-9-]+)\.png$/

function srcSet(name: string, format: 'avif' | 'webp'): string {
  return WIDTHS.map((width) => `/nft/opt/${name}-${width}.${format} ${width}w`).join(', ')
}

/**
 * Artwork served as responsive AVIF/WebP (generated from the Figma PNGs by `npm run images`), with
 * the original PNG as the fallback. `sizes` is the rendered width, so the browser picks the
 * smallest file for the screen density. `<picture>` uses `display: contents`, so the `<img>` keeps
 * its place in flex and absolute layouts.
 */
export function NftImage({ src, sizes, ...img }: ComponentProps<'img'> & { src: string; sizes: string }) {
  const name = ARTWORK.exec(src)?.[1]
  if (!name) return <img src={src} {...img} />
  return (
    <picture className="contents">
      {/* `hidden`: with display: contents the sources would otherwise become flex items (and take gaps). */}
      <source hidden type="image/avif" srcSet={srcSet(name, 'avif')} sizes={sizes} />
      <source hidden type="image/webp" srcSet={srcSet(name, 'webp')} sizes={sizes} />
      <img src={src} decoding="async" {...img} />
    </picture>
  )
}
