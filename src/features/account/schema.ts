import { z } from 'zod'
import type { Profile } from '@/types'

const REQUIRED = 'Campo obrigatório'
const PASSWORD_RULE = 'Use ao menos 8 caracteres, com letras e números'

/**
 * One "Salvar" for the whole screen: profile fields are always sent; the password block is
 * optional, but once any of its fields is filled all three are required.
 */
export const profileFormSchema = z
  .object({
    displayName: z.string().trim().min(1, REQUIRED).max(60, 'Use até 60 caracteres'),
    username: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^[a-z0-9_]{3,20}$/i, 'Use de 3 a 20 letras, números ou _'),
    email: z.string().trim().min(1, REQUIRED).email('Informe um e-mail válido'),
    ensName: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^[a-z0-9-]{3,63}$/i, 'Use de 3 a 63 letras, números ou hífen'),
    ensSuffix: z.literal('.eth'),
    walletNickname: z.string().trim().min(1, REQUIRED).max(40, 'Use até 40 caracteres'),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const { currentPassword, newPassword, confirmPassword } = values
    if (!currentPassword && !newPassword && !confirmPassword) return
    if (!currentPassword) context.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe sua senha atual' })
    if (!(newPassword.length >= 8 && /[a-z]/i.test(newPassword) && /\d/.test(newPassword))) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: PASSWORD_RULE })
    } else if (newPassword === currentPassword) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'A nova senha deve ser diferente da atual' })
    }
    if (confirmPassword !== newPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem' })
    }
  })

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export function profileToValues(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    ensSuffix: '.eth',
    walletNickname: profile.walletNickname,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}
