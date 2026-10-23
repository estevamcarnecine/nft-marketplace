import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from '@/features/account/api'
import { sessionQuery } from '@/lib/session'
import userIcon from '@/assets/account/user.svg'

const ITEM =
  'cursor-pointer rounded-[3px] px-[10px] py-[8px] text-[14px] leading-[20px] text-foreground focus:bg-surface-dark focus:text-text-accent'

/**
 * Signed-in replacement for the header's "Entrar" button (no Figma frame shows this state): same
 * 100×35 slot and style, opening the account shortcuts and logout.
 */
export function AccountMenu() {
  const navigate = useNavigate()
  const onPrivateRoute = useRouterState({
    select: (state) => state.matches.some((match) => match.routeId.startsWith('/_authenticated')),
  })
  const session = useQuery(sessionQuery)
  const logout = useLogout()
  const user = session.data?.user

  // Logging out swaps this menu for the "Entrar" button, unmounting it before the request settles;
  // per-call mutate callbacks would never run, so the follow-up waits on the promise instead.
  async function handleLogout() {
    await logout.mutateAsync().catch(() => undefined)
    toast.success('Você saiu da sua conta.')
    if (onPrivateRoute) void navigate({ to: '/' })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={user ? `Conta de ${user.name}` : 'Conta'}
        className="flex h-[35px] w-[100px] items-center justify-center gap-[4px] rounded-button bg-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden
          className="size-[20px] bg-ink"
          // Quoted: Vite inlines small SVGs as data URIs, which break an unquoted url().
          style={{ mask: `url("${userIcon}") center / 18px 18px no-repeat` }}
        />
        <span className="text-[16px] leading-[normal] font-medium whitespace-nowrap text-ink">Conta</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[220px] rounded-[6px] border border-border bg-surface-card p-[6px] text-foreground ring-0"
      >
        <DropdownMenuLabel className="flex flex-col gap-[2px] px-[10px] py-[8px]">
          <span className="truncate text-[14px] leading-[20px] font-bold text-foreground">
            {user?.name ?? 'Carregando…'}
          </span>
          {user && <span className="truncate text-[12px] leading-[16px] font-normal text-text-secondary">{user.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className={ITEM}>
          <Link to="/profile">Dados do perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM}>
          <Link to="/wallets">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className={`${ITEM} font-bold text-text-accent`}
          disabled={logout.isPending}
          onSelect={() => void handleLogout()}
        >
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
