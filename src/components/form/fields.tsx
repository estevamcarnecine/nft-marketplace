import type { ComponentProps, ReactNode } from 'react'
import { Select } from 'radix-ui'
import { cn } from 'cn'

import arrowDown from '@/assets/checkout/arrow-down.svg'

export const CONTROL =
  'h-[40px] w-full rounded-[3px] border border-border bg-transparent px-[12px] text-[14px] leading-[15px] text-foreground outline-none placeholder:text-secondary aria-invalid:border-destructive'

export function FieldLabel({
  htmlFor,
  id,
  children,
  required,
}: {
  htmlFor?: string
  id?: string
  children: ReactNode
  required?: boolean
}) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <Tag htmlFor={htmlFor} id={id} className="flex items-center whitespace-nowrap">
      <span className="text-[15px] leading-[15px] text-foreground">{children}</span>
      {required && (
        <span aria-hidden className="text-right text-[22px] leading-[29px] text-text-coral">
          *
        </span>
      )}
    </Tag>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-[4px] text-[12px] leading-[16px] text-destructive">
      {message}
    </p>
  )
}

export function TextField({
  id,
  label,
  error,
  required,
  className,
  ...input
}: ComponentProps<'input'> & { id: string; label: string; error?: string }) {
  return (
    <div className={cn('flex w-full flex-col items-start', className)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={CONTROL}
        {...input}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function SelectField<T extends string>({
  id,
  label,
  placeholder,
  value,
  options,
  error,
  icon = { src: arrowDown, size: 'size-[18px]' },
  className,
  onChange,
  onBlur,
}: {
  id: string
  label: string
  placeholder: string
  icon?: { src: string; size: string }
  className?: string
  value: T | ''
  options: readonly { id: T; label: string }[]
  error?: string
  onChange: (value: T) => void
  onBlur?: () => void
}) {
  return (
    <div className={cn('flex w-full flex-col items-start', className)}>
      <FieldLabel id={`${id}-label`} required>
        {label}
      </FieldLabel>
      <Select.Root
        value={value || undefined}
        onValueChange={(next) => {
          const option = options.find((item) => item.id === next)
          if (option) onChange(option.id)
        }}
        onOpenChange={(open) => !open && onBlur?.()}
      >
        <Select.Trigger
          id={id}
          aria-labelledby={`${id}-label`}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            CONTROL,
            'flex items-center justify-between py-[12px] pr-[8px] text-left data-[placeholder]:text-secondary',
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <img alt="" src={icon.src} className={cn('block max-w-none', icon.size)} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-50 min-w-(--radix-select-trigger-width) overflow-hidden rounded-[3px] border border-border bg-surface-card"
          >
            <Select.Viewport className="p-[4px]">
              {options.map((option) => (
                <Select.Item
                  key={option.id}
                  value={option.id}
                  className="cursor-pointer rounded-[3px] px-[8px] py-[10px] text-[14px] leading-[15px] text-foreground outline-none data-[highlighted]:bg-surface-dark data-[state=checked]:text-text-accent"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
