import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from 'cn'

import { isApiError } from '@/lib/api'
import { signupSchema, useSignup, type SignupForm as SignupValues } from '../api'
import { AuthInput, PasswordInput, type AuthVariant } from './fields'

const FIELDS: FieldPath<SignupValues>[] = ['username', 'email', 'password']

export function SignupForm({ onSuccess, variant = 'dialog' }: { onSuccess: () => void; variant?: AuthVariant }) {
  const page = variant === 'page'
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const submit = handleSubmit((values) =>
    signup.mutate(values, {
      onSuccess,
      onError: (error) => {
        if (!isApiError(error)) return setError('root', { message: 'Não foi possível criar a conta. Tente novamente.' })
        const fields = FIELDS.filter((field) => error.errors?.[field])
        fields.forEach((field, index) =>
          setError(field, { type: 'server', message: error.errors?.[field] }, { shouldFocus: index === 0 }),
        )
        if (fields.length === 0) setError('root', { message: error.message })
      },
    }),
  )

  return (
    <form noValidate onSubmit={submit} aria-label="Criar conta" className="flex w-full flex-col items-start">
      <div
        className={
          page
            ? 'flex w-full flex-col items-start gap-[12px]'
            : 'flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]'
        }
      >
        <AuthInput
          id="signup-username"
          label="Nome de usuário"
          placeholder="Nome de usuário"
          autoComplete="username"
          spellCheck={false}
          variant={variant}
          error={errors.username?.message}
          {...register('username')}
        />
        <AuthInput
          id="signup-email"
          type="email"
          label="E-mail"
          placeholder="Digite seu e-mail"
          autoComplete="email"
          variant={variant}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          id="signup-password"
          label="Senha"
          placeholder="Senha"
          autoComplete="new-password"
          variant={variant}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          id="signup-confirm-password"
          label="Confirmar senha"
          placeholder="Confirmar senha"
          autoComplete="new-password"
          toggle={page}
          variant={variant}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <div
        className={
          page
            ? 'flex w-full flex-col items-start gap-[12px] pt-[40px]'
            : 'flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]'
        }
      >
        {errors.root && (
          <p role="alert" className="w-full text-center text-[13px] leading-[16px] text-destructive">
            {errors.root.message}
          </p>
        )}
        <button
          type="submit"
          disabled={signup.isPending}
          aria-busy={signup.isPending}
          className={cn(
            'flex w-full items-center justify-center overflow-clip bg-primary text-[16px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60',
            page ? 'h-[60px] rounded-[10px]' : 'h-[45px] rounded-[5px]',
          )}
        >
          {signup.isPending ? 'Criando conta…' : page ? 'Criar perfil' : 'Criar conta'}
        </button>
      </div>
    </form>
  )
}
