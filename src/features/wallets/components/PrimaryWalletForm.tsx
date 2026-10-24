import { useEffect } from 'react'
import { Controller, useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from 'radix-ui'
import { toast } from 'sonner'

import { CONTROL, FieldError, SelectField, TextField } from '@/components/form/fields'
import { isApiError } from '@/lib/api'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { Profile } from '@/types'
import { useSavePrimary } from '../api'
import { primaryWalletSchema, profileToPrimary, type PrimaryWalletValues } from '../schema'
import arrowDown20 from '@/assets/account/arrow-down-20.svg'
import arrowDownEns from '@/assets/account/arrow-down.svg'

// In this frame each label sits 4px closer to its input than on the profile screen.
const FIELD = 'w-[417px] max-xl:w-full [&>:first-child]:-mb-[4px]'
const ARROW = { src: arrowDown20, size: 'size-[20px]' }
const FIELDS: FieldPath<PrimaryWalletValues>[] = [
  'displayName',
  'walletNickname',
  'network',
  'profileName',
  'walletAddress',
  'secondaryWallet',
  'walletType',
  'referralCode',
  'email',
  'ensName',
]

export function PrimaryWalletForm({ profile, onAdd }: { profile: Profile; onAdd: () => void }) {
  const save = useSavePrimary()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PrimaryWalletValues>({ resolver: zodResolver(primaryWalletSchema), defaultValues: profileToPrimary(profile) })

  // Adding a new primary wallet (or editing it in the list) changes the profile on the server.
  useEffect(() => {
    if (!isDirty) reset(profileToPrimary(profile))
  }, [profile, isDirty, reset])

  const submit = handleSubmit(async (values) => {
    if (!values.network || !values.walletType) return
    try {
      const saved = await save.mutateAsync({
        ...profile,
        ...values,
        network: values.network,
        walletType: values.walletType,
        referralCode: values.referralCode.toUpperCase(),
        // A secondary delivery wallet is chosen below; this field is only an ENS or extra address.
        secondaryWallet: profile.useAnotherWallet ? profile.secondaryWallet : values.secondaryWallet,
      })
      reset(profileToPrimary(saved))
      toast.success('Carteira principal salva.')
    } catch (error) {
      const fields = FIELDS.filter((field) => isApiError(error) && error.errors?.[field])
      fields.forEach((field, index) =>
        setError(field, { type: 'server', message: isApiError(error) ? error.errors?.[field] : '' }, { shouldFocus: index === 0 }),
      )
      if (fields.length === 0) toast.error(isApiError(error) ? error.message : 'Não foi possível salvar a carteira.')
    }
  })

  return (
    <form noValidate onSubmit={submit} aria-labelledby="primary-wallet-title" className="flex w-full flex-col items-start gap-[32px]">
      <div className="flex w-full flex-col items-start gap-[8px] overflow-clip whitespace-nowrap max-xl:whitespace-normal">
        <div className="flex w-full items-start justify-between leading-[16px]">
          <h1 id="primary-wallet-title" className="text-[17px] font-bold text-foreground">
            Carteira principal
          </h1>
          <button type="button" onClick={onAdd} className="text-[16px] font-medium text-text-accent">
            Adicionar<span className="sr-only"> carteira principal</span>
          </button>
        </div>
        <p className="text-[14px] leading-[15px] text-text-secondary">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      </div>

      <div className="flex w-full flex-col items-start gap-[24px] overflow-clip">
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <TextField id="displayName" label="Nome de exibição" required autoComplete="name" className={FIELD} error={errors.displayName?.message} {...register('displayName')} />
          <TextField id="walletNickname" label="Apelido da carteira" required autoComplete="off" className={FIELD} error={errors.walletNickname?.message} {...register('walletNickname')} />
        </div>
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <Controller
            control={control}
            name="network"
            render={({ field }) => (
              <SelectField id="network" label="Rede" placeholder="Selecione uma rede" value={field.value} options={NETWORKS} icon={ARROW} className={FIELD} error={errors.network?.message} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
          <TextField id="profileName" label="Nome do perfil" required className={FIELD} error={errors.profileName?.message} {...register('profileName')} />
        </div>
        <div className="flex w-full items-end justify-between max-xl:flex-col max-xl:items-start max-xl:gap-[24px]">
          <TextField id="walletAddress" label="Endereço da carteira" required placeholder="Endereço 0x da carteira" autoComplete="off" spellCheck={false} className={FIELD} error={errors.walletAddress?.message} {...register('walletAddress')} />
          <div className="flex w-[417px] max-xl:w-full flex-col">
            <input
              id="secondaryWallet"
              aria-label="ENS ou carteira secundária (opcional)"
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
        </div>
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <Controller
            control={control}
            name="walletType"
            render={({ field }) => (
              <SelectField id="walletType" label="Tipo de carteira" placeholder="Selecione uma carteira" value={field.value} options={WALLET_TYPES} icon={ARROW} className={FIELD} error={errors.walletType?.message} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
          <TextField id="referralCode" label="Código de indicação" required autoComplete="off" className={FIELD} error={errors.referralCode?.message} {...register('referralCode')} />
        </div>
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <TextField id="email" type="email" label="E-mail" required autoComplete="email" className={FIELD} error={errors.email?.message} {...register('email')} />
          <div className="flex w-[417px] max-xl:w-full flex-col items-start">
            <span className="-mb-[4px] flex items-center gap-[4px] whitespace-nowrap">
              <label htmlFor="ensName" className="text-[15px] leading-[15px] text-foreground">
                Nome ENS
              </label>
              <span aria-hidden className="text-[22px] leading-[29px] text-text-coral">
                *
              </span>
            </span>
            <div className="flex h-[40px] w-full items-start gap-[10px]">
              <Controller
                control={control}
                name="ensSuffix"
                render={({ field }) => (
                  <Select.Root value={field.value} onValueChange={() => field.onChange('.eth')}>
                    <Select.Trigger aria-label="Sufixo ENS" className="relative h-[40px] w-[78px] shrink-0 rounded-[3px] border border-border text-left text-[15px] leading-[15px] text-foreground outline-none">
                      <span className="absolute top-[12px] left-[9px]">
                        <Select.Value />
                      </span>
                      <Select.Icon asChild>
                        <img alt="" src={arrowDownEns} className="absolute top-[9px] left-[52px] block size-[20px] max-w-none" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content position="popper" sideOffset={4} className="z-50 rounded-[3px] border border-border bg-surface-card p-[4px]">
                        <Select.Viewport>
                          <Select.Item value=".eth" className="cursor-pointer rounded-[3px] px-[8px] py-[10px] text-[15px] leading-[15px] text-text-accent outline-none data-[highlighted]:bg-surface-dark">
                            <Select.ItemText>.eth</Select.ItemText>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                )}
              />
              <input
                id="ensName"
                required
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.ensName)}
                aria-describedby={errors.ensName ? 'ensName-error' : undefined}
                className={`${CONTROL} w-[329px] max-xl:w-auto max-xl:min-w-px max-xl:flex-1`}
                {...register('ensName')}
              />
            </div>
            <FieldError id="ensName-error" message={errors.ensName?.message} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex h-[40px] w-[131px] items-center justify-center overflow-clip rounded-[3px] bg-primary text-center text-[14px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
      >
        {isSubmitting ? 'Salvando…' : 'Salvar carteira'}
      </button>
    </form>
  )
}
