import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye } from 'lucide-react'
import { cn } from 'cn'

import { ComingSoon } from '@/components/common/ComingSoon'
import { isApiError } from '@/lib/api'
import { loginSchema, useLogin, type LoginForm as LoginValues } from '../api'
import hideIcon from '@/assets/auth/hide.svg'

const INPUT =
  'h-[40px] w-full overflow-clip rounded-[5px] border border-border bg-transparent px-[16px] py-[12px] leading-[16px] text-foreground outline-none placeholder:text-secondary focus:border-primary aria-invalid:border-destructive'

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="-mt-[6px] text-[12px] leading-[16px] text-destructive">
      {message}
    </p>
  ) : null
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
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
      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]">
        <label htmlFor="login-email" className="sr-only">
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className={cn(INPUT, 'text-[14px]')}
          {...register('email')}
        />
        <FieldError id="login-email-error" message={errors.email?.message} />

        <div className="relative w-full">
          <label htmlFor="login-password" className="sr-only">
            Senha
          </label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Senha"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className={cn(INPUT, 'pr-[44px] text-[16px] placeholder:text-[14px]')}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            aria-controls="login-password"
            className="absolute top-1/2 right-[10px] flex size-[24px] -translate-y-1/2 items-center justify-center"
          >
            {showPassword ? (
              <Eye aria-hidden strokeWidth={1.5} className="size-[20px] text-secondary" />
            ) : (
              <img alt="" src={hideIcon} className="block h-[14.645px] w-[18.981px] max-w-none" />
            )}
          </button>
        </div>
        <FieldError id="login-password-error" message={errors.password?.message} />

        <div className="flex w-full items-start justify-end overflow-clip">
          <ComingSoon className="text-[14px] leading-[16px] whitespace-nowrap text-text-accent">Esqueceu a senha?</ComingSoon>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]">
        {errors.root && (
          <p role="alert" className="w-full text-center text-[13px] leading-[16px] text-destructive">
            {errors.root.message}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          aria-busy={login.isPending}
          className="flex h-[45px] w-full items-center justify-center overflow-clip rounded-[5px] bg-primary text-[16px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}
