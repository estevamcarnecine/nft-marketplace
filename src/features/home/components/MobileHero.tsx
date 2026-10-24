import { NftImage } from '@/components/common/NftImage'
import heroMask from '@/assets/mobile/home/hero-mask.svg'
import arrowRight from '@/assets/mobile/home/arrow-right.svg'
import heroDots from '@/assets/mobile/home/hero-dots.svg'

/** Figma "Mobile / Início" Hero Banner (70395:240). The artwork is the same as the desktop hero's. */
export function MobileHero() {
  function explore() {
    document.getElementById('mercado')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <section
      aria-labelledby="mobile-hero-title"
      // 190px tall at the frame width; narrower phones wrap the copy, so the banner may grow.
      className="relative flex min-h-[190px] w-full shrink-0 flex-col items-center justify-center overflow-clip rounded-[12px] p-[16px]"
    >
      <img alt="" src={heroMask} className="absolute inset-0 block size-full max-w-none" />
      <div className="relative flex w-full flex-col items-center gap-[16px]">
        <div className="flex w-full items-center gap-[8px]">
          <div className="flex min-w-px flex-1 flex-col items-start">
            <div className="flex w-full flex-col items-start gap-[6px]">
              <p className="text-[12px] leading-[16px] font-medium text-foreground">Bem-vindo à Kurio</p>
              <h1 id="mobile-hero-title" className="w-[190px] text-[18px] leading-[29px] font-bold text-foreground">
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </h1>
              <p className="text-[12px] leading-[18px] text-text-secondary">Descubra NFTs selecionados de criadores do mundo todo.</p>
            </div>
            <button type="button" onClick={explore} className="flex items-center gap-[8px] py-[4px] text-[12px] leading-[14px] font-bold text-text-accent">
              EXPLORAR
              <span aria-hidden className="relative flex size-[16px] items-center justify-center">
                <img alt="" src={arrowRight} className="block h-[11.5px] w-[9.533px] max-w-none -rotate-90" />
              </span>
            </button>
          </div>
          <div aria-hidden className="relative h-[146px] w-[138px] shrink-0">
            <NftImage alt="" src="/nft/emerald-ape.png" sizes="138px" fetchPriority="high" className="absolute top-0 left-0 size-[138px] rounded-[16px] object-cover" />
            <NftImage alt="" src="/nft/cosmic-bloom.png" sizes="58px" className="absolute top-[88px] left-[14px] size-[58px] rounded-[16px] object-cover" />
          </div>
        </div>
        <img alt="" src={heroDots} className="block h-[7px] w-[33px] max-w-none" />
      </div>
    </section>
  )
}
