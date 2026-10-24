import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const WIDTHS = [160, 320, 640, 960]
const SOURCE = path.resolve('public/nft')
const OUTPUT = path.join(SOURCE, 'opt')

await mkdir(OUTPUT, { recursive: true })
const files = (await readdir(SOURCE)).filter((file) => file.endsWith('.png'))

for (const file of files) {
  const name = path.basename(file, '.png')
  for (const width of WIDTHS) {
    const image = sharp(path.join(SOURCE, file)).resize({ width, withoutEnlargement: true })
    await image.clone().avif({ quality: 55, effort: 6 }).toFile(path.join(OUTPUT, `${name}-${width}.avif`))
    await image.clone().webp({ quality: 78 }).toFile(path.join(OUTPUT, `${name}-${width}.webp`))
  }
  console.log(`${name}: ${WIDTHS.join(', ')}px`)
}
