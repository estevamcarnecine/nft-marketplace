import type { FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ComingSoon } from '@/components/common/ComingSoon'
import type { CollectionId } from '@/types'
import facebook from '@/assets/footer/social-facebook.svg'
import instagram from '@/assets/footer/social-instagram.svg'
import linkedin from '@/assets/footer/social-linkedin.svg'
import twitter from '@/assets/footer/social-twitter.svg'
import youtube from '@/assets/footer/social-youtube.svg'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const FOOTER_COLLECTIONS: { id: CollectionId; label: string }[] = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'utilidade', label: 'Utilidade' },
]

const SOCIALS = [
  { label: 'Facebook', icon: facebook },
  { label: 'Instagram', icon: instagram },
  { label: 'Twitter', icon: twitter },
  { label: 'LinkedIn', icon: linkedin },
  { label: 'YouTube', icon: youtube },
]

const HEADING = 'text-[18px] leading-[16px] font-bold text-foreground'
const LINK = 'block text-[14px] leading-[30px] font-normal text-foreground'

function Separator() {
  return <span aria-hidden className="w-px self-stretch bg-primary" />
}

function Newsletter() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast.info('A newsletter ainda não está disponível nesta demonstração.')
  }

  return (
    <div className="flex h-full w-[357px] shrink-0 flex-col items-center gap-[12px] px-[16px]">
      <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[16px]">
        <label htmlFor="newsletter-email" className="w-full text-[18px] leading-[16px] font-bold text-foreground">
          Antecipe-se ao próximo lançamento
        </label>
        <div className="flex h-[40px] w-full items-center justify-between rounded-[6px] bg-surface-dark py-[12px] pl-[12px] drop-shadow-[0px_0px_10px_rgba(10,6,4,0.45)]">
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="digite seu e-mail..."
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[16px] text-foreground outline-none placeholder:text-secondary"
          />
          <button
            type="submit"
            className="flex h-[40px] w-[85px] shrink-0 items-center justify-center rounded-tr-[6px] rounded-br-[6px] bg-primary py-[12px] pr-[4px] pl-[16px] text-[18px] leading-[16px] font-bold whitespace-nowrap text-ink"
          >
            Enviar
          </button>
        </div>
      </form>
      <p className="min-h-[89px] w-full text-[13px] leading-[22px] text-text-secondary">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="flex w-full flex-col items-start">
      <div className="flex h-[250px] w-full flex-col items-start bg-surface-card p-[32px]">
        <div className="flex w-[1154px] max-w-none items-end justify-between">
          {FEATURES.map((feature, index) => (
            <div key={feature.letter} className="contents">
              {index > 0 && <Separator />}
              <div
                className={
                  index === 0
                    ? 'flex min-w-px flex-1 flex-col px-[16px]'
                    : 'flex w-[264.667px] shrink-0 flex-col px-[16px]'
                }
              >
                <div className="flex w-full flex-col items-start gap-[12px]">
                  <span
                    aria-hidden
                    className="flex size-[74px] items-center justify-center rounded-[37px] bg-primary text-[24px] leading-[normal] font-bold text-ink"
                  >
                    {feature.letter}
                  </span>
                  <h2 className="w-full text-[17px] leading-[16px] font-bold text-foreground">{feature.title}</h2>
                  <p className="w-[204px] text-[14px] leading-[22px] text-text-secondary">{feature.text}</p>
                </div>
              </div>
            </div>
          ))}
          <Separator />
          <Newsletter />
        </div>
      </div>

      <div className="flex w-full flex-col items-start">
        <div className="flex h-[88px] w-full flex-col items-start justify-center bg-surface-dark p-[32px]">
          <div className="flex min-h-px w-full flex-1 items-center gap-[92px]">
            <div className="flex min-w-px flex-1 items-center overflow-clip py-[8px]">
              <span className="text-[14px] leading-[normal] font-bold tracking-[1.4px] whitespace-nowrap text-foreground">
                KURIO
              </span>
            </div>
            <p className="flex h-full min-w-px flex-1 items-center text-[14px] leading-[22px] whitespace-nowrap text-foreground">
              Feito para colecionadores,
              <br />
              criadores e cultura
            </p>
            <div className="flex min-w-px flex-1 items-center">
              <a
                href="mailto:contato@email.com"
                className="text-[14px] leading-[22px] whitespace-nowrap text-foreground"
              >
                contato@email.com
              </a>
            </div>
            <div className="flex w-[228px] shrink-0 items-center">
              <a href="tel:+551140028922" className="text-[14px] leading-[22px] whitespace-nowrap text-foreground">
                +55 11 4002 8922
              </a>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-[6px]">
          <div className="flex h-[236px] w-full flex-col items-start bg-surface-card p-[32px]">
            <div className="flex w-full items-start gap-[124px]">
              <nav aria-labelledby="footer-profile" className="flex min-w-px flex-1 flex-col items-start gap-[8px]">
                <h2 id="footer-profile" className={HEADING}>
                  Meu perfil
                </h2>
                <div className="w-full">
                  <Link to="/profile" className={LINK}>
                    Meu perfil
                  </Link>
                  <ComingSoon className={LINK}>Minha coleção</ComingSoon>
                  <ComingSoon className={LINK}>Atividade</ComingSoon>
                  <ComingSoon className={LINK}>Estúdio do criador</ComingSoon>
                  <ComingSoon className={LINK}>Lista de interesse</ComingSoon>
                </div>
              </nav>
              <nav aria-labelledby="footer-help" className="flex min-w-px flex-1 flex-col items-start gap-[8px]">
                <h2 id="footer-help" className={HEADING}>
                  Central de ajuda
                </h2>
                <div className="w-full">
                  {[
                    'Central de ajuda',
                    'Como comprar NFTs',
                    'Carteira e segurança',
                    'Política do mercado',
                    'Denunciar item',
                  ].map((label) => (
                    <ComingSoon key={label} className={LINK}>
                      {label}
                    </ComingSoon>
                  ))}
                </div>
              </nav>
              <nav aria-labelledby="footer-collections" className="flex min-w-px flex-1 flex-col items-start gap-[8px]">
                <h2 id="footer-collections" className={HEADING}>
                  Coleções
                </h2>
                <div className="w-full">
                  {FOOTER_COLLECTIONS.map((collection) => (
                    <Link
                      key={collection.id}
                      to="/"
                      search={{ collections: [collection.id] }}
                      hash="mercado"
                      className={LINK}
                    >
                      {collection.label}
                    </Link>
                  ))}
                </div>
              </nav>
              <div className="flex w-[228px] shrink-0 flex-col items-start gap-[32px]">
                <div className="flex w-[190px] flex-col items-start gap-[20px]">
                  <h2 className={HEADING}>Redes sociais</h2>
                  <ul className="flex w-full items-center gap-[10px]">
                    {SOCIALS.map((social) => (
                      <li key={social.label}>
                        <ComingSoon className="relative block size-[30px]">
                          <span className="absolute inset-[-3.33%]">
                            <img alt={social.label} src={social.icon} className="block size-full max-w-none" />
                          </span>
                        </ComingSoon>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex w-full flex-col items-start gap-[12px]">
                  <h2 className={HEADING}>Carteiras compatíveis</h2>
                  <p className="flex h-[26px] w-full items-center justify-center rounded-[6px] border border-border-soft bg-surface-dark py-[8px] pl-[8px] text-[9px] leading-[normal] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
                    {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="w-full text-center text-[14px] leading-[30px] text-foreground">
            © 2026 Kurio. Propriedade digital para todos.
          </p>
        </div>
      </div>
    </footer>
  )
}
