import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { isApiError } from '@/lib/api'
import { signupSchema, useSignup, type SignupForm as SignupValues } from '../api'
import { AuthInput, PasswordInput } from './fields'

const FIELDS: FieldPath<SignupValues>[] = ['username', 'email', 'password']

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
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
        // 422 validation and 409 conflicts (e-mail or username taken) both name the field.
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
      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]">
        <AuthInput
          id="signup-username"
          label="Nome de usuário"
          placeholder="Nome de usuário"
          autoComplete="username"
          spellCheck={false}
          error={errors.username?.message}
          {...register('username')}
        />
        <AuthInput
          id="signup-email"
          type="email"
          label="E-mail"
          placeholder="Digite seu e-mail"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          id="signup-password"
          label="Senha"
          placeholder="Senha"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          id="signup-confirm-password"
          label="Confirmar senha"
          placeholder="Confirmar senha"
          autoComplete="new-password"
          toggle={false}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-[12px] overflow-clip px-[80px] pt-[24px]">
        {errors.root && (
          <p role="alert" className="w-full text-center text-[13px] leading-[16px] text-destructive">
            {errors.root.message}
          </p>
        )}
        <button
          type="submit"
          disabled={signup.isPending}
          aria-busy={signup.isPending}
          className="flex h-[45px] w-full items-center justify-center overflow-clip rounded-[5px] bg-primary text-[16px] leading-[16px] font-bold whitespace-nowrap text-ink disabled:opacity-60"
        >
          {signup.isPending ? 'Criando conta…' : 'Criar conta'}
        </button>
      </div>
    </form>
  )
}
