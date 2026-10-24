import { useQuery } from '@tanstack/react-query'
import { useFormContext } from 'react-hook-form'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { walletsQuery } from '@/features/wallets/api'
import { shortAddress } from '@/lib/format'
import { NETWORKS } from '@/types'
import type { CheckoutForm } from '../schema'
import walletIcon from '@/assets/mobile/checkout/wallet.svg'

export function SavedWalletsMenu() {
  const wallets = useQuery(walletsQuery)
  const { setValue, formState } = useFormContext<CheckoutForm>()

  if (!wallets.data?.length) return null

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Usar carteira cadastrada"
        title="Usar carteira cadastrada"
        className="flex size-[28px] items-center justify-center rounded-[3px] hover:bg-surface-dark focus-visible:outline-2 focus-visible:outline-ring"
      >
        <img alt="" src={walletIcon} className="block h-[14.8px] w-[16px] max-w-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-[280px] rounded-[6px] border border-border bg-surface-card p-[6px] text-foreground ring-0"
      >
        <DropdownMenuLabel className="px-[10px] py-[6px] text-[12px] leading-[16px] font-normal text-text-secondary">
          Suas carteiras
        </DropdownMenuLabel>
        {wallets.data.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            onSelect={() => {
              const options = { shouldDirty: true, shouldValidate: formState.isSubmitted }
              setValue('walletAddress', wallet.address, options)
              setValue('network', wallet.network, options)
              setValue('walletType', wallet.type, options)
            }}
            className="flex cursor-pointer flex-col items-start gap-[2px] rounded-[3px] px-[10px] py-[8px] focus:bg-surface-dark"
          >
            <span className="text-[14px] leading-[18px] font-bold text-foreground">
              {wallet.label}
              {wallet.isDefault && <span className="font-normal text-text-secondary"> · principal</span>}
            </span>
            <span className="text-[12px] leading-[16px] text-text-secondary">
              {shortAddress(wallet.address)} · {NETWORKS.find((network) => network.id === wallet.network)?.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
