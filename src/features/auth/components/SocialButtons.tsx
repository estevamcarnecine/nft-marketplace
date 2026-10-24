import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import facebook from '@/assets/auth/facebook.svg'
import dividerLeft from '@/assets/auth/divider-left.svg'
import dividerRight from '@/assets/auth/divider-right.svg'
import dividerPage from '@/assets/mobile/auth/divider.svg'
import google1 from '@/assets/auth/google/part-1.svg'
import google2 from '@/assets/auth/google/part-2.svg'
import google3 from '@/assets/auth/google/part-3.svg'
import google4 from '@/assets/auth/google/part-4.svg'
import google5 from '@/assets/auth/google/part-5.svg'
import google6 from '@/assets/auth/google/part-6.svg'
import google7 from '@/assets/auth/google/part-7.svg'

const GOOGLE_PARTS: [string, string][] = [
  [google1, 'inset-[57.68%_17.83%_0_7.11%]'],
  [google2, 'top-[71.33%] right-[17.83%] bottom-0 left-1/2'],
  [google3, 'inset-[24.69%_75.25%_24.69%_0]'],
  [google4, 'inset-[38.28%_0_11.97%_47.07%]'],
  [google5, 'top-[38.28%] right-0 bottom-[11.97%] left-1/2'],
  [google6, 'inset-[0_17.01%_57.68%_7.11%]'],
  [google7, 'top-0 right-[17.01%] bottom-[70.51%] left-1/2'],
]

function GoogleMark() {
  return (
    <span aria-hidden className="relative size-[20px] shrink-0 overflow-clip">
      {GOOGLE_PARTS.map(([src, position]) => (
        <span key={src} className={`absolute ${position}`}>
          <img alt="" src={src} className="absolute inset-0 block size-full max-w-none" />
        </span>
      ))}
    </span>
  )
}

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          aria-describedby="social-unavailable"
          onClick={(event) => event.preventDefault()}
          className="flex h-[40px] w-full cursor-not-allowed items-center justify-center overflow-clip rounded-[5px] border border-border"
        >
          <span className="flex items-center gap-[12px]">
            {icon}
            <span className="text-center text-[13px] leading-[16px] font-medium whitespace-nowrap text-text-secondary">
              {label}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Indisponível nesta demonstração</TooltipContent>
    </Tooltip>
  )
}

export function SocialButtons({ gap = 12, variant = 'dialog' }: { gap?: 12 | 16; variant?: 'dialog' | 'page' }) {
  const page = variant === 'page'
  const spacing = page || gap === 16 ? 'gap-[16px]' : 'gap-[12px]'
  return (
    <div
      className={
        page
          ? 'flex w-full flex-col items-start gap-[12px] overflow-clip'
          : `flex w-full flex-col items-start overflow-clip pt-[24px] ${spacing}`
      }
    >
      <div className={`flex w-full items-center overflow-clip ${page ? 'gap-[10px]' : 'gap-[12px]'}`}>
        <span aria-hidden className="relative h-0 min-w-px flex-1">
          <span className="absolute inset-[-1px_0_0_0]">
            <img alt="" src={page ? dividerPage : dividerLeft} className="block size-full max-w-none" />
          </span>
        </span>
        <span className="text-[13px] leading-[16px] whitespace-nowrap text-foreground">Ou continue com</span>
        <span aria-hidden className="relative h-0 min-w-px flex-1">
          <span className="absolute inset-[-1px_0_0_0]">
            <img alt="" src={page ? dividerPage : dividerRight} className="block size-full max-w-none" />
          </span>
        </span>
      </div>
      <div className={`flex w-full flex-col items-start ${page ? '' : 'px-[80px]'} ${spacing}`}>
        <SocialButton icon={<GoogleMark />} label="Continuar com Google" />
        <SocialButton
          icon={<img alt="" src={facebook} className="block size-[20px] max-w-none shrink-0" />}
          label="Continuar com Facebook"
        />
        <p id="social-unavailable" className="sr-only">
          O login com Google e Facebook não está disponível nesta demonstração.
        </p>
      </div>
    </div>
  )
}
