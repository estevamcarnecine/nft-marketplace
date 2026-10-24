import { ComingSoon } from '@/components/common/ComingSoon'

const POSTS = [
  {
    date: '12 de setembro',
    reading: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/nft/ivory-baron.png',
  },
  {
    date: '13 de setembro',
    reading: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: '/nft/emerald-ape.png',
  },
  {
    date: '15 de setembro',
    reading: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/nft/cosmic-bloom.png',
  },
  {
    date: '15 de setembro',
    reading: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/nft/golden-beat.png',
  },
]

export function Blog() {
  return (
    <section aria-labelledby="blog-title" className="flex w-full flex-col items-center gap-[40px]">
      <div className="flex w-full flex-col items-center gap-[12px] overflow-clip text-center leading-[normal]">
        <h2 id="blog-title" className="w-full text-[28px] font-bold text-text-primary">
          Diário da Cunhagem
        </h2>
        <p className="w-full text-[14px] text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="flex w-full items-stretch gap-[24px] overflow-clip">
        {POSTS.map((post) => (
          <li
            key={post.title}
            className="flex w-[268px] shrink-0 flex-col items-start overflow-clip rounded-[8px] bg-surface-card"
          >
            <img
              alt=""
              src={post.image}
              width={268}
              height={195}
              loading="lazy"
              className="h-[195px] w-full max-w-none object-cover"
            />
            <article className="flex w-full flex-1 flex-col items-start gap-[8px] overflow-clip px-[16px] pt-[12px] pb-[16px]">
              <p className="w-full text-[12px] leading-[16px] font-medium whitespace-pre-wrap text-text-secondary">
                {`${post.date}  |  ${post.reading}`}
              </p>
              <h3 className="w-full text-[16px] leading-[normal] font-bold text-text-primary">{post.title}</h3>
              <p className="w-full text-[12px] leading-[16px] font-medium text-text-secondary">{post.text}</p>
              <ComingSoon className="flex items-start gap-[4px] overflow-clip text-[12px] whitespace-nowrap text-text-accent">
                <span className="leading-[14px] font-bold">Ler mais</span>
                <span aria-hidden className="leading-[normal]">
                  →
                </span>
                <span className="sr-only"> sobre {post.title}</span>
              </ComingSoon>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
