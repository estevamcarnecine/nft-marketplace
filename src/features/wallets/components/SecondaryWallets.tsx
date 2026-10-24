import { RadioGroup } from 'radix-ui'
import { toast } from 'sonner'
import { cn } from 'cn'

import { shortAddress } from '@/lib/format'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { Profile, Wallet } from '@/types'
import { useDeleteWallet, useMakeDefaultWallet, useSetDelivery } from '../api'

const PRIMARY = 'primary'

function Radio({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <RadioGroup.Item
      value={value}
      aria-label={label}
      className={cn(
        'group relative size-[16px] shrink-0 rounded-full border-[1.2px] border-primary',
        'data-[state=checked]:after:absolute data-[state=checked]:after:inset-[1.8px] data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-primary',
        className,
      )}
    />
  )
}

function WalletRow({ wallet, onEdit }: { wallet: Wallet; onEdit: (wallet: Wallet) => void }) {
  const makeDefault = useMakeDefaultWallet()
  const remove = useDeleteWallet()
  const busy = makeDefault.isPending || remove.isPending
  const type = WALLET_TYPES.find((item) => item.id === wallet.type)?.label
  const network = NETWORKS.find((item) => item.id === wallet.network)?.label

  return (
    <li aria-busy={busy} className="flex h-[56px] w-full items-center gap-[12px] rounded-[3px] border border-border px-[16px]">
      <Radio value={wallet.id} label={`Receber NFTs em ${wallet.label}`} />
      <span className="flex min-w-px flex-1 flex-col gap-[4px] leading-[16px]">
        <span className="truncate text-[15px] text-foreground">{wallet.label}</span>
        <span className="truncate text-[13px] text-secondary">
          {type} · {network} · <span title={wallet.address}>{shortAddress(wallet.address)}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-[16px] text-[14px] leading-[16px] text-text-accent">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            makeDefault.mutate(wallet.id, {
              onSuccess: () => toast.success(`${wallet.label} agora é a carteira principal.`),
              onError: () => toast.error('Não foi possível alterar a carteira principal.'),
            })
          }
          className="disabled:opacity-50"
        >
          Tornar principal
        </button>
        <button type="button" disabled={busy} onClick={() => onEdit(wallet)} className="disabled:opacity-50">
          Editar<span className="sr-only"> {wallet.label}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            remove.mutate(wallet.id, {
              onSuccess: () => toast.success(`${wallet.label} removida.`),
              onError: () => toast.error('Não foi possível remover a carteira.'),
            })
          }
          className="text-text-coral disabled:opacity-50"
        >
          Remover<span className="sr-only"> {wallet.label}</span>
        </button>
      </span>
    </li>
  )
}

/**
 * "Carteira secundária": the non-primary wallets, and where purchased NFTs go. The design's
 * "Igual à carteira principal" radio is the first option; each secondary wallet is another.
 */
export function SecondaryWallets({
  wallets,
  profile,
  onAdd,
  onEdit,
}: {
  wallets: Wallet[]
  profile: Profile
  onAdd: () => void
  onEdit: (wallet: Wallet) => void
}) {
  const delivery = useSetDelivery()
  const secondary = wallets.filter((wallet) => !wallet.isDefault)
  const selected =
    (profile.useAnotherWallet && secondary.find((wallet) => wallet.address === profile.secondaryWallet)?.id) || PRIMARY

  function choose(value: string) {
    if (value === selected) return
    delivery.mutate(value === PRIMARY ? null : value, {
      onSuccess: () => toast.success('Carteira de recebimento atualizada.'),
      onError: () => toast.error('Não foi possível alterar a carteira de recebimento.'),
    })
  }

  return (
    <section aria-labelledby="secondary-wallet-title" className="flex w-full flex-col items-start gap-[12px] overflow-clip">
      <RadioGroup.Root
        value={selected}
        onValueChange={choose}
        aria-label="Carteira que recebe os NFTs comprados"
        aria-busy={delivery.isPending}
        className="flex w-full flex-col items-start gap-[12px]"
      >
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <h2 id="secondary-wallet-title" className="text-[17px] leading-[16px] font-bold whitespace-nowrap text-foreground">
            Carteira secundária
          </h2>
          <div className="relative h-[16px] w-[343px] shrink-0 max-xl:w-full">
            <Radio value={PRIMARY} label="Igual à carteira principal" className="absolute top-0 left-0" />
            <span aria-hidden className="absolute top-0 left-[24px] text-[14px] leading-[16px] whitespace-nowrap text-foreground">
              Igual à carteira principal
            </span>
            <button
              type="button"
              onClick={onAdd}
              className="absolute top-0 left-[251px] text-[16px] leading-[16px] font-medium whitespace-nowrap text-text-accent"
            >
              Adicionar<span className="sr-only"> carteira secundária</span>
            </button>
          </div>
        </div>
        {secondary.length === 0 ? (
          <p className="text-[14px] leading-[15px] whitespace-nowrap text-text-secondary max-xl:whitespace-normal">
            Você ainda não adicionou uma carteira secundária.
          </p>
        ) : (
          <ul aria-label="Carteiras secundárias" className="flex w-full flex-col gap-[12px]">
            {secondary.map((wallet) => (
              <WalletRow key={wallet.id} wallet={wallet} onEdit={onEdit} />
            ))}
          </ul>
        )}
      </RadioGroup.Root>
    </section>
  )
}
