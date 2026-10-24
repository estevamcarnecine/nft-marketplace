import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Controller, useForm, type FieldPath, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from 'radix-ui'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'

import { CONTROL, FieldError, FieldLabel, TextField } from '@/components/form/fields'
import { isApiError, type ApiError } from '@/lib/api'
import type { Profile } from '@/types'
import { useChangePassword, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '../api'
import { profileFormSchema, profileToValues, type ProfileFormValues } from '../schema'
import arrowDown from '@/assets/account/arrow-down.svg'
import hideIcon from '@/assets/account/hide.svg'
import imageIcon from '@/assets/account/image.svg'

const FIELD = 'w-[417px] max-xl:w-full gap-[10px]'
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'
const PROFILE_FIELDS: FieldPath<ProfileFormValues>[] = ['displayName', 'username', 'email', 'ensName', 'walletNickname']

function PasswordField({
  id,
  label,
  error,
  autoComplete,
  register,
}: {
  id: FieldPath<ProfileFormValues>
  label: string
  error?: string
  autoComplete: string
  register: UseFormRegister<ProfileFormValues>
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex w-[417px] max-xl:w-full flex-col items-start gap-[12px] overflow-clip">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative w-full">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${CONTROL} px-[16px] pr-[48px]`}
          {...register(id)}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-1/2 right-[16px] size-[20px] -translate-y-1/2"
        >
          {visible ? (
            <Eye aria-hidden strokeWidth={1.5} className="size-[20px] text-secondary" />
          ) : (
            <span aria-hidden className="absolute inset-[16.67%_8.33%_11.36%_8.33%]">
              <img alt="" src={hideIcon} className="absolute inset-0 block size-full max-w-none" />
            </span>
          )}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function AvatarField({ profile }: { profile: Profile }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState<string | null>(null)
  const busy = upload.isPending || remove.isPending

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    upload.mutate(file, {
      onSuccess: () => toast.success('Avatar atualizado.'),
      onError: (failure) =>
        setError(
          isApiError(failure) ? (failure.errors?.avatar ?? failure.message) : 'Não foi possível enviar a imagem.',
        ),
    })
  }

  function handleRemove() {
    setError(null)
    remove.mutate(undefined, {
      onSuccess: () => toast.success('Avatar removido.'),
      onError: () => setError('Não foi possível remover o avatar. Tente novamente.'),
    })
  }

  return (
    <div className="flex w-[417px] max-xl:w-full flex-col items-start gap-[10px] overflow-clip">
      <span id="avatar-label" className="text-[15px] leading-[15px] whitespace-nowrap text-foreground">
        Avatar
      </span>
      <div
        role="group"
        aria-labelledby="avatar-label"
        aria-describedby={error ? 'avatar-error' : undefined}
        className="flex items-center gap-[24px]"
      >
        <span
          aria-busy={busy}
          className="relative flex size-[50px] shrink-0 items-start overflow-hidden rounded-[25px] border border-border bg-surface-raised p-[12px]"
        >
          {profile.avatarUrl ? (
            <img alt="Seu avatar" src={profile.avatarUrl} className="absolute inset-0 size-full object-cover" />
          ) : (
            <span aria-hidden className="relative size-[24px] shrink-0">
              <span className="absolute inset-[11.46%]">
                <span className="absolute inset-[-4.05%]">
                  <img alt="" src={imageIcon} className="block size-full max-w-none" />
                </span>
              </span>
            </span>
          )}
        </span>
        <span className="flex items-center gap-[20px]">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex h-[40px] w-[98px] items-center justify-center rounded-[3px] bg-primary text-[14px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
          >
            {upload.isPending ? 'Enviando…' : 'Alterar'}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy || !profile.avatarUrl}
            className="text-[14px] leading-[16px] whitespace-nowrap text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remover
          </button>
        </span>
        <input
          ref={input}
          type="file"
          accept={AVATAR_ACCEPT}
          onChange={handleFile}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      {error && (
        <p id="avatar-error" role="alert" className="text-[12px] leading-[16px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileToValues(profile),
  })
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!form.formState.isDirty) reset(profileToValues(profile))
  }, [profile, form, reset])

  function applyServerErrors(error: ApiError, fields: FieldPath<ProfileFormValues>[]) {
    const matched = fields.filter((field) => error.errors?.[field])
    matched.forEach((field, index) =>
      setError(field, { type: 'server', message: error.errors?.[field] }, { shouldFocus: index === 0 }),
    )
    return matched.length > 0
  }

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await updateProfile.mutateAsync({
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        ensName: values.ensName,
        ensSuffix: values.ensSuffix,
        walletNickname: values.walletNickname,
      })
      if (values.newPassword) {
        try {
          await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
        } catch (error) {
          reset({
            ...profileToValues(saved),
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
          })
          if (!isApiError(error) || !applyServerErrors(error, ['currentPassword', 'newPassword'])) {
            toast.error('Perfil salvo, mas não foi possível alterar a senha.')
          }
          return
        }
      }
      reset(profileToValues(saved))
      toast.success(values.newPassword ? 'Perfil e senha atualizados.' : 'Perfil atualizado.')
    } catch (error) {
      if (!isApiError(error) || !applyServerErrors(error, PROFILE_FIELDS)) {
        toast.error(isApiError(error) ? error.message : 'Não foi possível salvar. Tente novamente.')
      }
    }
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="profile-title"
      className="flex min-w-px flex-1 flex-col items-start gap-[32px] overflow-clip"
    >
      <h1 id="profile-title" className="text-[16px] leading-[16px] font-bold whitespace-nowrap text-foreground">
        Perfil do colecionador
      </h1>

      <div className="flex w-full flex-col items-start gap-[24px] overflow-clip">
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <TextField
            id="displayName"
            label="Nome de exibição"
            required
            autoComplete="name"
            className={FIELD}
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <TextField
            id="username"
            label="Nome de usuário"
            required
            autoComplete="username"
            className={FIELD}
            error={errors.username?.message}
            {...register('username')}
          />
        </div>
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <TextField
            id="email"
            type="email"
            label="E-mail"
            required
            autoComplete="email"
            className={FIELD}
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="flex w-[417px] max-xl:w-full flex-col items-start gap-[10px] overflow-clip">
            <span className="flex items-center gap-[4px] whitespace-nowrap">
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
                    <Select.Trigger
                      aria-label="Sufixo ENS"
                      className="relative h-[40px] w-[78px] shrink-0 rounded-[3px] border border-border text-left text-[15px] leading-[15px] text-foreground outline-none"
                    >
                      <span className="absolute top-[12px] left-[9px]">
                        <Select.Value />
                      </span>
                      <Select.Icon asChild>
                        <img
                          alt=""
                          src={arrowDown}
                          className="absolute top-[9px] left-[52px] block size-[20px] max-w-none"
                        />
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
              <input
                id="ensName"
                required
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.ensName)}
                aria-describedby={errors.ensName ? 'ensName-error' : undefined}
                className={`${CONTROL} w-[329px]`}
                {...register('ensName')}
              />
            </div>
            <FieldError id="ensName-error" message={errors.ensName?.message} />
          </div>
        </div>
        <div className="flex w-full items-start justify-between max-xl:flex-col max-xl:gap-[24px]">
          <TextField
            id="walletNickname"
            label="Apelido da carteira"
            required
            autoComplete="off"
            className={FIELD}
            error={errors.walletNickname?.message}
            {...register('walletNickname')}
          />
          <AvatarField profile={profile} />
        </div>
      </div>

      <fieldset className="flex w-full flex-col items-start gap-[24px] overflow-clip">
        <legend className="mb-[24px] text-[16px] leading-[16px] font-medium whitespace-nowrap text-foreground">
          Alterar senha
        </legend>
        <PasswordField
          id="currentPassword"
          label="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          register={register}
        />
        <PasswordField
          id="newPassword"
          label="Nova senha"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          register={register}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          register={register}
        />
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex h-[40px] w-[131px] items-center justify-center overflow-clip rounded-[3px] bg-primary text-[14px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
      >
        {isSubmitting ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
