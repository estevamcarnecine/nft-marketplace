import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { ComingSoon } from '@/components/common/ComingSoon'
import { Hairline } from '@/components/common/Hairline'
import { cartQuery } from '@/features/cart/api'
import activeUnderline from '@/assets/header/active-underline-home.svg'
import activeUnderlineMarket from '@/assets/header/active-underline-market.svg'
import badge from '@/assets/header/badge.svg'
import cartIcon from '@/assets/header/cart.svg'
import divider from '@/assets/header/divider.svg'
import logoutIcon from '@/assets/header/logout.svg'
import searchIcon from '@/assets/header/search.svg'

export type HeaderSection = 'home' | 'market'

const INACTIVE_ITEM = 'text-[16px] leading-[normal] font-normal whitespace-nowrap text-foreground'

function NavLabel({ label, underline }: { label: string; underline?: string }) {
  if (!underline) return <span className={INACTIVE_ITEM}>{label}</span>

  return (
    <span className="flex flex-col items-start gap-[24px]">
      <span className="text-[16px] leading-[normal] font-bold whitespace-nowrap text-text-accent">{label}</span>
      <span className="relative h-0 w-full">
        <span className="absolute inset-[-3px_0_0_0]">
          <img alt="" src={underline} className="block size-full max-w-none" />
        </span>
      </span>
    </span>
  )
}

function CartButton() {
  const { data } = useQuery(cartQuery)
  const count = data?.count ?? 0

  return (
    <Link to="/cart" aria-label={`Carrinho, ${count} itens`} className="relative block h-[24px] w-[24.004px]">
      <img alt="" src={cartIcon} className="absolute inset-0 block size-full max-w-none" />
      {count > 0 && (
        <span className="absolute top-0 left-[15px] size-[16px]">
          <span className="absolute inset-[-12.5%]">
            <img alt="" src={badge} className="block size-full max-w-none" />
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium leading-none text-ink">
            {count}
          </span>
        </span>
      )}
    </Link>
  )
}

export function Header({ active }: { active: HeaderSection }) {
  return (
    <header className="flex w-full flex-col items-start">
      <div className="flex w-full items-start justify-between">
        <Link to="/" className="relative h-[34.3px] w-[160px] overflow-clip">
          <span className="absolute top-[8.15px] left-0 text-[14px] leading-[normal] font-bold tracking-[1.4px] whitespace-nowrap text-foreground">
            KURIO
          </span>
        </Link>

        <nav aria-label="Principal" className="flex items-start gap-[40px]">
          <Link to="/" aria-current={active === 'home' ? 'page' : undefined}>
            <NavLabel label="Início" underline={active === 'home' ? activeUnderline : undefined} />
          </Link>
          <Link to="/" hash="mercado" aria-current={active === 'market' ? 'page' : undefined}>
            <NavLabel label="Mercado" underline={active === 'market' ? activeUnderlineMarket : undefined} />
          </Link>
          <ComingSoon className={INACTIVE_ITEM}>Criadores</ComingSoon>
          <ComingSoon className={INACTIVE_ITEM}>Aprenda</ComingSoon>
        </nav>

        <div className="flex items-center gap-[28px]">
          <button type="button" aria-label="Buscar" className="relative h-[20px] w-[20.001px] cursor-pointer">
            <img alt="" src={searchIcon} className="absolute inset-0 block size-full max-w-none" />
          </button>
          <CartButton />
          <Link
            to="/login"
            className="flex h-[35px] w-[100px] items-center justify-center rounded-button bg-primary"
          >
            <span className="flex items-start gap-[4px]">
              <span className="relative size-[20px]">
                <span className="absolute inset-[11.46%_9.2%_11.46%_9.41%]">
                  <span className="absolute inset-[-4.86%_-4.61%]">
                    <img alt="" src={logoutIcon} className="block size-full max-w-none" />
                  </span>
                </span>
              </span>
              <span className="text-[16px] leading-[normal] font-medium whitespace-nowrap text-ink">Entrar</span>
            </span>
          </Link>
        </div>
      </div>

      <Hairline src={divider} />
    </header>
  )
}
