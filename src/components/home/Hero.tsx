import { Link } from '@tanstack/react-router'

import carouselDots from '@/assets/home/carousel-dots.svg'
import { NftImage } from '@/components/common/NftImage'
import heroBg from '@/assets/home/hero-bg.svg'

export function Hero() {
  return (
    <section className="relative flex h-[450px] items-center pl-[40px]">
      <img alt="" src={heroBg} className="absolute top-0 left-0 block h-[450px] w-[1200px] max-w-none" />

      <div className="relative flex w-[1160px] items-center justify-between">
        <div className="flex w-[600px] flex-col items-end gap-[44px]">
          <div className="flex w-full flex-col items-start gap-[32px]">
            <div className="flex w-full flex-col items-start gap-[4px]">
              <div className="flex w-full flex-col items-start gap-[8px] text-foreground">
                <p className="w-full text-[14px] font-medium leading-[16px] tracking-[1.4px]">Bem-vindo à Kurio</p>
                <h1 className="w-full text-[43px] font-bold leading-[70px]">
                  <span className="block">SEJA DONO DO FUTURO</span>
                  <span className="block">DA ARTE DIGITAL</span>
                </h1>
              </div>
              <p className="w-[557px] text-[14px] font-normal leading-[24px] text-text-secondary">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
                artistas e tenha uma parte da cultura da internet.
              </p>
            </div>
            <Link
              to="/"
              hash="mercado"
              className="flex h-[40px] w-[140px] items-center justify-center rounded-button bg-primary py-[10px] pr-[36px] pl-[28px]"
            >
              <span className="text-[16px] font-bold leading-[20px] whitespace-nowrap text-ink">EXPLORAR</span>
            </Link>
          </div>
          <img alt="" src={carouselDots} className="block h-[8px] w-[40px] max-w-none" />
        </div>

        {/* The largest element above the fold on desktop: fetched first. */}
        <NftImage
          alt="Macaco de óculos escuros e jaqueta verde"
          src="/nft/emerald-ape.png"
          sizes="450px"
          width={450}
          height={450}
          fetchPriority="high"
          className="size-[450px] shrink-0 rounded-[24px] object-cover"
        />
      </div>
    </section>
  )
}
