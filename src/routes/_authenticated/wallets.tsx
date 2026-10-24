import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import { AccountLayout } from '@/features/account/components/AccountLayout'
import { profileQuery } from '@/features/checkout/api'
import { walletsQuery } from '@/features/wallets/api'
import { PrimaryWalletForm } from '@/features/wallets/components/PrimaryWalletForm'
import { SecondaryWallets } from '@/features/wallets/components/SecondaryWallets'
import { WalletDialog, type WalletDialogMode } from '@/features/wallets/components/WalletDialog'

export const Route = createFileRoute('/_authenticated/wallets')({
  component: WalletsPage,
})

function WalletsPage() {
  const profile = useQuery(profileQuery)
  const wallets = useQuery(walletsQuery)
  const [dialog, setDialog] = useState<WalletDialogMode | null>(null)
  const failed = profile.isError || wallets.isError

  return (
    <AccountLayout active="wallets">
        <div className="flex min-w-px flex-1 flex-col items-start gap-[32px] overflow-clip">
          {failed ? (
            <p role="alert" className="text-[14px] leading-[24px] text-text-secondary">
              Não foi possível carregar suas carteiras.{' '}
              <button
                type="button"
                onClick={() => {
                  void profile.refetch()
                  void wallets.refetch()
                }}
                className="font-bold text-text-accent underline"
              >
                Tentar novamente
              </button>
            </p>
          ) : profile.isPending || wallets.isPending ? (
            <div aria-busy="true" aria-label="Carregando carteiras" className="flex w-full flex-col gap-[24px]">
              <Skeleton className="h-[39px] w-full" />
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex justify-between max-xl:flex-col max-xl:gap-[12px]">
                  <Skeleton className="h-[65px] w-[417px] max-xl:w-full" />
                  <Skeleton className="h-[65px] w-[417px] max-xl:w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <PrimaryWalletForm profile={profile.data} onAdd={() => setDialog({ kind: 'create', primary: true })} />
              <SecondaryWallets
                wallets={wallets.data}
                profile={profile.data}
                onAdd={() => setDialog({ kind: 'create', primary: false })}
                onEdit={(wallet) => setDialog({ kind: 'edit', wallet })}
              />
            </>
          )}
        </div>
      {dialog && (
        <WalletDialog
          mode={dialog}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast.success(message)
          }}
        />
      )}
    </AccountLayout>
  )
}
