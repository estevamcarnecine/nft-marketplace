import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { Select } from 'radix-ui'
import { cn } from 'cn'

import { NETWORKS, WALLET_TYPES } from '@/types'
import type { CheckoutForm } from '../schema'
import { CONTROL, FieldError, FieldLabel, SelectField, TextField } from '@/components/form/fields'
import { SavedWalletsMenu } from './SavedWalletsMenu'
import arrowDownEns from '@/assets/checkout/arrow-down-ens.svg'

function EnsSuffixField() {
  const { control } = useFormContext<CheckoutForm>()
  return (
    <div className="flex w-[92px] flex-col items-start">
      <span className="flex w-full items-center gap-[4px] whitespace-nowrap">
        <span id="ens-suffix-label" className="text-[15px] leading-[15px] text-foreground">
          Nome ENS
        </span>
        <span aria-hidden className="text-[22px] leading-[29px] text-text-coral">
          *
        </span>
      </span>
      <Controller
        control={control}
        name="ensSuffix"
        render={({ field }) => (
          <Select.Root value={field.value} onValueChange={() => field.onChange('.eth')}>
            <Select.Trigger
              aria-labelledby="ens-suffix-label"
              className="flex h-[40px] w-[78px] items-end gap-[6px] rounded-[3px] border border-border pt-[10px] pr-[8px] pb-[12px] pl-[10px] text-[15px] leading-[15px] text-foreground outline-none"
            >
              <Select.Value />
              <Select.Icon asChild>
                <img alt="" src={arrowDownEns} className="block size-[18px] max-w-none" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={4}
                className="z-50 rounded-[3px] border border-border bg-surface-card p-[4px]"
              >
                <Select.Viewport>
                  <Select.Item
                    value=".eth"
                    className="cursor-pointer rounded-[3px] px-[8px] py-[10px] text-[15px] leading-[15px] text-text-accent outline-none data-[highlighted]:bg-surface-dark"
                  >
                    <Select.ItemText>.eth</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}
      />
    </div>
  )
}

export function CollectorForm({ stacked = false }: { stacked?: boolean }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CheckoutForm>()
  const useAnotherWallet = useWatch({ control, name: 'useAnotherWallet' })

  return (
    <section aria-labelledby="collector-heading" className="flex min-w-px flex-1 flex-col items-start gap-[12px]">
      <h2
        id="collector-heading"
        className={stacked ? 'sr-only' : 'w-full text-[17px] leading-[16px] font-bold text-foreground'}
      >
        Perfil do colecionador
      </h2>
      <div className="flex w-full flex-col items-start gap-[24px]">
        <div className={stacked ? 'flex w-full flex-col items-start gap-[12px]' : 'flex w-full items-start gap-[24px]'}>
          <div className="flex w-full min-w-px flex-1 flex-col items-start gap-[12px]">
            <TextField
              id="displayName"
              label="Nome de exibição"
              required
              autoComplete="name"
              error={errors.displayName?.message}
              {...register('displayName')}
            />
            <Controller
              control={control}
              name="network"
              render={({ field }) => (
                <SelectField
                  id="network"
                  label="Rede"
                  placeholder="Selecione uma rede"
                  value={field.value}
                  options={NETWORKS}
                  error={errors.network?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <div className="relative w-full">
              <TextField
                id="walletAddress"
                label="Endereço da carteira"
                required
                placeholder="Endereço 0x da carteira"
                autoComplete="off"
                spellCheck={false}
                error={errors.walletAddress?.message}
                style={stacked ? undefined : { paddingRight: 40 }}
                {...register('walletAddress')}
              />
              {!stacked && (
                <span className="absolute top-[35px] right-[6px]">
                  <SavedWalletsMenu />
                </span>
              )}
            </div>
            <Controller
              control={control}
              name="walletType"
              render={({ field }) => (
                <SelectField
                  id="walletType"
                  label="Tipo de carteira"
                  placeholder="Selecione uma carteira"
                  value={field.value}
                  options={WALLET_TYPES}
                  error={errors.walletType?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <TextField
              id="email"
              type="email"
              label="E-mail"
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="flex w-full min-w-px flex-1 flex-col items-start gap-[12px]">
            <TextField
              id="username"
              label="Nome de usuário"
              required
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />
            <TextField
              id="profileName"
              label="Nome do perfil"
              required
              error={errors.profileName?.message}
              {...register('profileName')}
            />
            <div className="flex min-h-[69px] w-full flex-col items-start justify-end">
              <input
                id="secondaryWallet"
                aria-label={
                  useAnotherWallet
                    ? 'ENS ou carteira secundária (obrigatório)'
                    : 'ENS ou carteira secundária (opcional)'
                }
                placeholder="ENS ou carteira secundária (opcional)"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.secondaryWallet)}
                aria-describedby={errors.secondaryWallet ? 'secondaryWallet-error' : undefined}
                className={CONTROL}
                {...register('secondaryWallet')}
              />
              <FieldError id="secondaryWallet-error" message={errors.secondaryWallet?.message} />
            </div>
            <TextField
              id="referralCode"
              label="Código de indicação"
              required
              autoComplete="off"
              error={errors.referralCode?.message}
              {...register('referralCode')}
            />
            <EnsSuffixField />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-[8px]">
          <input type="checkbox" className="peer sr-only" {...register('useAnotherWallet')} />
          <span
            aria-hidden
            className={cn(
              'relative mt-[2px] size-[15px] shrink-0 rounded-full border-2 border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
              useAnotherWallet && 'after:absolute after:inset-[2px] after:rounded-full after:bg-primary',
            )}
          />
          <span className="text-[15px] leading-[normal] whitespace-nowrap text-foreground">Usar outra carteira?</span>
        </label>

        <div className={cn('flex flex-col items-start gap-[12px]', stacked ? 'w-full' : 'w-[350px]')}>
          <FieldLabel htmlFor="note">Observação do colecionador (opcional)</FieldLabel>
          <textarea
            id="note"
            aria-invalid={Boolean(errors.note)}
            aria-describedby={errors.note ? 'note-error' : undefined}
            className="h-[152px] w-full resize-none rounded-[3px] border border-border bg-transparent p-[12px] text-[14px] leading-[20px] text-foreground outline-none aria-invalid:border-destructive"
            {...register('note')}
          />
          <FieldError id="note-error" message={errors.note?.message} />
        </div>
      </div>
    </section>
  )
}
