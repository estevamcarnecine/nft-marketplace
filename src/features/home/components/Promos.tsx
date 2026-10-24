import { Link } from '@tanstack/react-router'

import type { CatalogSearch } from '@/features/catalog/search'
import promoArrow from '@/assets/catalog/promo-arrow.svg'
import promoMask from '@/assets/catalog/promo-mask.svg'

interface Promo {
  id: string
  title: [string, string]
  text: string
  image: string
  imageBox: string
  titleRight: string
  textRight: string
  buttonLeft: string
  search: CatalogSearch
}

const PROMOS: Promo[] = [
  {
    id: 'genesis',
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/nft/emerald-ape.png',
    imageBox: 'left-[-5px] w-[292px] rounded-[18px]',
    titleRight: 'right-[30px]',
    textRight: 'right-[30px] w-[263px]',
    buttonLeft: 'left-[416px]',
    search: { tab: 'new' },
  },
  {
    id: 'curated',
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/nft/ivory-baron.png',
    imageBox: 'left-[2px] w-[287px] rounded-[17px]',
    titleRight: 'right-[35px]',
    textRight: 'right-[39px] w-[252px]',
    buttonLeft: 'left-[411px]',
    search: { collections: ['arte-digital'] },
  },
]

export function Promos() {
  return (
    <section aria-label="Destaques do mercado" className="flex w-full items-start justify-between">
      {PROMOS.map((promo) => (
        <article key={promo.id} aria-labelledby={`promo-${promo.id}`} className="relative h-[250px] w-[586px] overflow-clip rounded-[8px] bg-surface-card">
          <img
            alt=""
            src={promo.image}
            width={292}
            height={250}
            loading="lazy"
            className={`absolute top-0 h-[250px] max-w-none object-cover ${promo.imageBox}`}
          />
          <h3 id={`promo-${promo.id}`} className={`absolute top-[37px] text-right text-[18px] leading-[24px] font-bold whitespace-nowrap text-foreground ${promo.titleRight}`}>
            {promo.title[0]}
            <br />
            {promo.title[1]}
          </h3>
          <p className={`absolute top-[94px] h-[45px] text-right text-[14px] leading-[24px] text-text-secondary ${promo.textRight}`}>{promo.text}</p>
          <Link
            to="/"
            search={promo.search}
            hash="mercado"
            className={`absolute top-[164px] flex h-[40px] w-[140px] items-center justify-center gap-0 rounded-[6px] bg-primary ${promo.buttonLeft}`}
          >
            <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap text-ink">Explorar</span>
            <span aria-hidden className="flex size-[18px] shrink-0 items-center justify-center">
              <img alt="" src={promoArrow} className="block h-[12.75px] w-[10.537px] max-w-none -rotate-90" />
            </span>
            <span className="sr-only"> {promo.title.join(' ')}</span>
          </Link>
          <img aria-hidden alt="" src={promoMask} className="pointer-events-none absolute inset-0 block h-[250px] w-[586px] max-w-none" />
        </article>
      ))}
    </section>
  )
}
