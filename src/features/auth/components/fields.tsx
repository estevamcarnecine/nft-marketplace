import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye } from 'lucide-react'
import { cn } from 'cn'

import hideIcon from '@/assets/auth/hide.svg'

const INPUT =
  'h-[40px] w-full overflow-clip rounded-[5px] border border-border bg-transparent px-[16px] py-[12px] leading-[16px] text-foreground outline-none placeholder:text-secondary focus:border-primary aria-invalid:border-destructive'

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="-mt-[6px] text-[12px] leading-[16px] text-destructive">
      {message}
    </p>
  ) : null
}

type AuthInputProps = ComponentProps<'input'> & { id: string; label: string; error?: string }

/** Figma auth input: the label is the placeholder visually, and stays available to screen readers. */
export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { id, label, error, className, ...input },
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
        className={cn(INPUT, 'text-[14px]', className)}
        {...input}
      />
      <FieldError id={`${id}-error`} message={error} />
    </>
  )
})

/** Password input with the Figma "Hide" toggle; the shown state uses the same stroke weight. */
export const PasswordInput = forwardRef<HTMLInputElement, AuthInputProps & { toggle?: boolean }>(
  function PasswordInput({ id, label, error, toggle = true, ...input }, ref) {
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
            className={cn(INPUT, toggle && 'pr-[44px]', 'text-[16px] placeholder:text-[14px]')}
            {...input}
          />
          {toggle && (
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={visible}
              aria-controls={id}
              className="absolute top-1/2 right-[10px] flex size-[24px] -translate-y-1/2 items-center justify-center"
            >
              {visible ? (
                <Eye aria-hidden strokeWidth={1.5} className="size-[20px] text-secondary" />
              ) : (
                <img alt="" src={hideIcon} className="block h-[14.645px] w-[18.981px] max-w-none" />
              )}
            </button>
          )}
        </div>
        <FieldError id={`${id}-error`} message={error} />
      </>
    )
  },
)
