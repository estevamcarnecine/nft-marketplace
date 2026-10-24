import { Controller, useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { SelectField, TextField } from '@/components/form/fields'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { isApiError } from '@/lib/api'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { Wallet } from '@/types'
import { useCreateWallet, useUpdateWallet } from '../api'
import { walletSchema, type WalletFormValues } from '../schema'
import arrowDown20 from '@/assets/account/arrow-down-20.svg'

const ARROW = { src: arrowDown20, size: 'size-[20px]' }
const FIELDS: FieldPath<WalletFormValues>[] = ['label', 'type', 'network', 'address']

export type WalletDialogMode = { kind: 'create'; primary: boolean } | { kind: 'edit'; wallet: Wallet }

export function WalletDialog({
  mode,
  onClose,
  onSaved,
}: {
  mode: WalletDialogMode
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const editing = mode.kind === 'edit' ? mode.wallet : null
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: editing
      ? { label: editing.label, type: editing.type, network: editing.network, address: editing.address }
      : { label: '', type: '', network: '', address: '' },
  })

  const title = editing
    ? 'Editar carteira'
    : mode.kind === 'create' && mode.primary
      ? 'Nova carteira principal'
      : 'Nova carteira secundária'

  const submit = handleSubmit(async (values) => {
    if (!values.type || !values.network) return
    const input = { label: values.label, type: values.type, network: values.network, address: values.address }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...input })
        onSaved('Carteira atualizada.')
      } else {
        await create.mutateAsync({ ...input, isDefault: mode.kind === 'create' && mode.primary })
        onSaved(
          mode.kind === 'create' && mode.primary
            ? 'Nova carteira principal adicionada.'
            : 'Carteira secundária adicionada.',
        )
      }
    } catch (error) {
      const fields = FIELDS.filter((field) => isApiError(error) && error.errors?.[field])
      fields.forEach((field, index) =>
        setError(
          field,
          { type: 'server', message: isApiError(error) ? error.errors?.[field] : '' },
          { shouldFocus: index === 0 },
        ),
      )
      if (fields.length === 0)
        setError('root', { message: isApiError(error) ? error.message : 'Não foi possível salvar a carteira.' })
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="w-[500px] max-w-[calc(100vw-32px)] gap-[24px] rounded-[6px] border-border bg-surface-card p-[32px] sm:max-w-[500px]">
        <div className="flex flex-col gap-[8px]">
          <DialogTitle className="text-[17px] leading-[16px] font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-[14px] leading-[20px] text-text-secondary">
            {mode.kind === 'create' && mode.primary
              ? 'A carteira atual passa a ser secundária.'
              : 'Use carteiras que você controla: os NFTs comprados podem ser enviados para elas.'}
          </DialogDescription>
        </div>
        <form noValidate onSubmit={submit} className="flex flex-col gap-[16px]">
          <TextField
            id="wallet-label"
            label="Apelido da carteira"
            required
            autoComplete="off"
            className="[&>:first-child]:-mb-[4px]"
            error={errors.label?.message}
            {...register('label')}
          />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectField
                id="wallet-type"
                label="Tipo de carteira"
                placeholder="Selecione uma carteira"
                value={field.value}
                options={WALLET_TYPES}
                icon={ARROW}
                className="[&>:first-child]:-mb-[4px]"
                error={errors.type?.message}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="network"
            render={({ field }) => (
              <SelectField
                id="wallet-network"
                label="Rede"
                placeholder="Selecione uma rede"
                value={field.value}
                options={NETWORKS}
                icon={ARROW}
                className="[&>:first-child]:-mb-[4px]"
                error={errors.network?.message}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <TextField
            id="wallet-address"
            label="Endereço da carteira"
            required
            placeholder="Endereço 0x da carteira"
            autoComplete="off"
            spellCheck={false}
            className="[&>:first-child]:-mb-[4px]"
            error={errors.address?.message}
            {...register('address')}
          />
          {errors.root && (
            <p role="alert" className="text-[13px] leading-[16px] text-destructive">
              {errors.root.message}
            </p>
          )}
          <div className="mt-[8px] flex justify-end gap-[8px]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-[40px] items-center rounded-[3px] border border-primary px-[20px] text-[14px] leading-[16px] font-medium text-text-accent disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex h-[40px] items-center rounded-[3px] bg-primary px-[20px] text-[14px] leading-[16px] font-bold text-ink disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar carteira'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
