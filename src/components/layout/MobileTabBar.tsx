import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'

import { ComingSoon } from '@/components/common/ComingSoon'
import { cartQuery } from '@/features/cart/api'
import { useToken } from '@/lib/auth'
import tabbarBg from '@/assets/mobile/home/tabbar-bg.svg'
import tabbarCenter from '@/assets/mobile/home/tabbar-center.svg'
import homeIcon from '@/assets/mobile/home/home.svg'
import heartIcon from '@/assets/mobile/home/heart.svg'
import shopIcon from '@/assets/mobile/home/shop.svg'
import userIcon from '@/assets/mobile/home/user.svg'
import scan1 from '@/assets/mobile/home/scan-1.svg'
import scan2 from '@/assets/mobile/home/scan-2.svg'
import scan3 from '@/assets/mobile/home/scan-3.svg'
import scan4 from '@/assets/mobile/home/scan-4.svg'
import scan5 from '@/assets/mobile/home/scan-5.svg'

const SLOT = 'absolute top-[59px] flex size-[44px] -translate-x-1/2 items-center justify-center rounded-full'
const SCAN_PARTS: [string, string][] = [
  [scan1, 'inset-[25.48%_46.66%_73.1%_46.86%]'],
  [scan2, 'inset-[27.53%_50.32%_64.29%_47.18%]'],
  [scan3, 'inset-[16.73%_46.98%_75.09%_50.51%]'],
  [scan4, 'inset-[27.54%_47%_64.33%_50.51%]'],
  [scan5, 'inset-[16.67%_50.31%_75.15%_47.18%]'],
]

export function MobileTabBar({ onSearch }: { onSearch: () => void }) {
  const location = useLocation()
  const signedIn = useToken() !== null
  const { data: cart } = useQuery(cartQuery)
  const count = cart?.count ?? 0

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto h-[calc(126px+env(safe-area-inset-bottom))] w-full max-w-[560px]"
    >
      <div className="relative h-[126px] w-full">
        <div aria-hidden className="absolute inset-[24.6%_0_0.04%_0]">
          <div className="absolute inset-[-42.13%_-7.25%_-21.06%_-7.25%]">
            <img alt="" src={tabbarBg} className="block size-full max-w-none" />
          </div>
        </div>

        <button
          type="button"
          onClick={onSearch}
          aria-label="Buscar NFTs"
          className="absolute top-0 left-1/2 size-[65px] -translate-x-1/2 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img alt="" src={tabbarCenter} className="absolute inset-0 block size-full max-w-none" />
        </button>
        {SCAN_PARTS.map(([src, inset]) => (
          <span key={src} aria-hidden className={`pointer-events-none absolute ${inset}`}>
            <img alt="" src={src} className="absolute inset-0 block size-full max-w-none" />
          </span>
        ))}

        <Link
          to="/"
          aria-label="Início"
          aria-current={location.pathname === '/' ? 'page' : undefined}
          className={`${SLOT} left-[11.1%]`}
        >
          <img alt="" src={homeIcon} className="block h-[16.667px] w-[15.833px] max-w-none" />
        </Link>
        <ComingSoon className={`${SLOT} left-[28.5%]`}>
          <img alt="" src={heartIcon} className="block h-[17.794px] w-[20px] max-w-none" />
          <span className="sr-only">Favoritos</span>
        </ComingSoon>
        <Link to="/cart" aria-label={`Carrinho, ${count} itens`} className={`${SLOT} left-[72.95%]`}>
          <img alt="" src={shopIcon} className="block size-[20px] max-w-none" />
          {count > 0 && (
            <span
              aria-hidden
              className="absolute top-[4px] right-[2px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-[3px] text-[10px] leading-none font-medium text-ink"
            >
              {count}
            </span>
          )}
        </Link>
        {signedIn ? (
          <Link to="/profile" aria-label="Meu perfil" className={`${SLOT} left-[87.9%]`}>
            <img alt="" src={userIcon} className="block size-[20px] max-w-none" />
          </Link>
        ) : (
          <Link to="/login" search={{ redirect: location.href }} aria-label="Entrar" className={`${SLOT} left-[87.9%]`}>
            <img alt="" src={userIcon} className="block size-[20px] max-w-none" />
          </Link>
        )}
      </div>
    </nav>
  )
}
