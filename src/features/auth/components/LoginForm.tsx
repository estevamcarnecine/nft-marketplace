import { useForm } from 'react-hook-form'
import { cn } from 'cn'
import { zodResolver } from '@hookform/resolvers/zod'

import { ComingSoon } from '@/components/common/ComingSoon'
import { isApiError } from '@/lib/api'
import { loginSchema, useLogin, type LoginForm as LoginValues } from '../api'
import { AuthInput, PasswordInput, type AuthVariant } from './fields'

export function LoginForm({ onSuccess, variant = 'dialog' }: { onSuccess: () => void; variant?: AuthVariant }) {
  const page = variant === 'page'
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const submit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess,
      onError: (error) => {
        if (!isApiError(error)) return setError('root', { message: 'Não foi possível entrar. Tente novamente.' })
        const fields = error.errors ?? {}
        if (fields.email) setError('email', { message: fields.email }, { shouldFocus: true })
        if (fields.password) setError('password', { message: fields.password }, { shouldFocus: !fields.email })
        if (!fields.email && !fields.password) setError('root', { message: error.message })
      },
    }),
  )

  return (
    <form noValidate onSubmit={submit} aria-label="Entrar" className="flex w-full flex-col items-start">
      <div className={page ? 'flex w-full flex-col items-start gap-[12px]' : 'flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]'}>
        <AuthInput
          id="login-email"
          type="email"
          label="E-mail"
          placeholder="contato@email.com"
          autoComplete="email"
          variant={variant}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          id="login-password"
          label="Senha"
          placeholder="Senha"
          autoComplete="current-password"
          variant={variant}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex w-full items-start justify-end overflow-clip">
          <ComingSoon className="text-[14px] leading-[16px] whitespace-nowrap text-text-accent">Esqueceu a senha?</ComingSoon>
        </div>
      </div>

      <div className={page ? 'flex w-full flex-col items-start gap-[12px] pt-[40px]' : 'flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]'}>
        {errors.root && (
          <p role="alert" className="w-full text-center text-[13px] leading-[16px] text-destructive">
            {errors.root.message}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          aria-busy={login.isPending}
          className={cn('flex w-full items-center justify-center overflow-clip bg-primary text-[16px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60', page ? 'h-[60px] rounded-[10px]' : 'h-[45px] rounded-[5px]')}
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}
