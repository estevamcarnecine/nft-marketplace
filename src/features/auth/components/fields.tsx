import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye } from 'lucide-react'
import { cn } from 'cn'

import hideIcon from '@/assets/auth/hide.svg'
import hideIconPage from '@/assets/mobile/auth/hide.svg'

const INPUT =
  'w-full overflow-clip border border-border bg-transparent px-[16px] py-[12px] leading-[16px] text-foreground outline-none placeholder:text-secondary focus:border-primary aria-invalid:border-destructive'

export type AuthVariant = 'dialog' | 'page'
const SIZE: Record<AuthVariant, string> = { dialog: 'h-[40px] rounded-[5px]', page: 'h-[50px] rounded-[10px]' }

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="-mt-[6px] text-[12px] leading-[16px] text-destructive">
      {message}
    </p>
  ) : null
}

type AuthInputProps = ComponentProps<'input'> & { id: string; label: string; error?: string; variant?: AuthVariant }

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { id, label, error, className, variant = 'dialog', ...input },
  ref,
) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(INPUT, SIZE[variant], 'text-[14px]', className)}
        {...input}
      />
      <FieldError id={`${id}-error`} message={error} />
    </>
  )
})

export const PasswordInput = forwardRef<HTMLInputElement, AuthInputProps & { toggle?: boolean }>(function PasswordInput(
  { id, label, error, toggle = true, variant = 'dialog', ...input },
  ref,
) {
  const [visible, setVisible] = useState(false)
  return (
    <>
      <div className="relative w-full">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(INPUT, SIZE[variant], toggle && 'pr-[44px]', 'text-[16px] placeholder:text-[14px]')}
          {...input}
        />
        {toggle && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            aria-controls={id}
            className={cn(
              'absolute top-1/2 flex size-[24px] -translate-y-1/2 items-center justify-center',
              variant === 'page' ? 'right-[13px]' : 'right-[10px]',
            )}
          >
            {visible ? (
              <Eye
                aria-hidden
                strokeWidth={1.5}
                className={cn('text-secondary', variant === 'page' ? 'size-[18px]' : 'size-[20px]')}
              />
            ) : variant === 'page' ? (
              <img alt="" src={hideIconPage} className="block h-[13.33px] w-[15.382px] max-w-none" />
            ) : (
              <img alt="" src={hideIcon} className="block h-[14.645px] w-[18.981px] max-w-none" />
            )}
          </button>
        )}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </>
  )
})
