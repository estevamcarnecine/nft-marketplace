import { HttpResponse, http } from 'msw'
import type { Profile } from '@/types'
import { db } from '../db'
import {
  authenticate,
  errorResponse,
  isEmail,
  json,
  readJson,
  str,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'
import { PASSWORD_RULE, RESERVED_USERNAMES, USERNAME_PATTERN, isStrongPassword } from '../validation'

const ENS_NAME = /^[a-z0-9-]{3,63}$/i
const NICKNAME_MAX = 40
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

function blankProfile(email: string, name: string): Profile {
  return {
    displayName: name,
    username: '',
    profileName: '',
    email,
    network: '',
    walletType: '',
    walletAddress: '',
    useAnotherWallet: false,
    secondaryWallet: '',
    ensName: '',
    ensSuffix: '.eth',
    referralCode: '',
    note: '',
    walletNickname: '',
    avatarUrl: null,
  }
}

async function toDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

/** Collector profile screen: account data, avatar and password. */
export const accountHandlers = [
  http.patch(
    '/api/profile',
    withScenario('profile.patch', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const input = await readJson(request)
      const displayName = str(input.displayName)
      const username = str(input.username)
      const email = str(input.email).toLowerCase()
      const ensName = str(input.ensName).toLowerCase()
      const walletNickname = str(input.walletNickname)

      const errors: Record<string, string> = {}
      if (!displayName) errors.displayName = 'Campo obrigatório'
      else if (displayName.length > 60) errors.displayName = 'Use até 60 caracteres'
      if (!USERNAME_PATTERN.test(username)) errors.username = 'Use de 3 a 20 letras, números ou _'
      if (!isEmail(email)) errors.email = 'Informe um e-mail válido'
      if (!ENS_NAME.test(ensName)) errors.ensName = 'Use de 3 a 63 letras, números ou hífen'
      if (input.ensSuffix !== '.eth') errors.ensSuffix = 'Selecione o sufixo ENS'
      if (!walletNickname) errors.walletNickname = 'Campo obrigatório'
      else if (walletNickname.length > NICKNAME_MAX) errors.walletNickname = `Use até ${NICKNAME_MAX} caracteres`
      if (Object.keys(errors).length > 0) return validationError(errors)

      const usernameTaken =
        RESERVED_USERNAMES.includes(username.toLowerCase()) ||
        [...db.profiles.entries()].some(
          ([id, profile]) => id !== user.id && profile.username.toLowerCase() === username.toLowerCase(),
        )
      if (usernameTaken) {
        const message = 'Este nome de usuário já está em uso'
        return errorResponse(409, 'USERNAME_TAKEN', message, { errors: { username: message } })
      }
      if (db.users.some((other) => other.id !== user.id && other.email === email)) {
        const message = 'Este e-mail já está cadastrado'
        return errorResponse(409, 'EMAIL_TAKEN', message, { errors: { email: message } })
      }

      const current = db.profiles.get(user.id) ?? blankProfile(user.email, user.name)
      const profile: Profile = { ...current, displayName, username, email, ensName, ensSuffix: '.eth', walletNickname }
      db.profiles.set(user.id, profile)
      // The e-mail is also the sign-in identifier.
      user.email = email
      user.name = displayName
      return json({ ...profile })
    }),
  ),

  http.put(
    '/api/profile/avatar',
    withScenario('profile.avatar', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const form = await request.formData().catch(() => null)
      const file = form?.get('avatar')
      if (!(file instanceof File)) return validationError({ avatar: 'Selecione uma imagem' })
      if (!AVATAR_TYPES.includes(file.type)) {
        return validationError({ avatar: 'Use uma imagem PNG, JPG, WEBP ou GIF' })
      }
      if (file.size > AVATAR_MAX_BYTES) return validationError({ avatar: 'A imagem deve ter até 2 MB' })

      const current = db.profiles.get(user.id) ?? blankProfile(user.email, user.name)
      const profile: Profile = { ...current, avatarUrl: await toDataUrl(file) }
      db.profiles.set(user.id, profile)
      return json({ ...profile })
    }),
  ),

  http.delete(
    '/api/profile/avatar',
    withScenario('profile.avatar.remove', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()
      const current = db.profiles.get(user.id) ?? blankProfile(user.email, user.name)
      const profile: Profile = { ...current, avatarUrl: null }
      db.profiles.set(user.id, profile)
      return json({ ...profile })
    }),
  ),

  http.post(
    '/api/profile/password',
    withScenario('profile.password', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const input = await readJson(request)
      const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : ''
      const newPassword = typeof input.newPassword === 'string' ? input.newPassword : ''

      const errors: Record<string, string> = {}
      if (!currentPassword) errors.currentPassword = 'Informe sua senha atual'
      if (!isStrongPassword(newPassword)) errors.newPassword = PASSWORD_RULE
      else if (newPassword === currentPassword) errors.newPassword = 'A nova senha deve ser diferente da atual'
      if (Object.keys(errors).length > 0) return validationError(errors)

      if (currentPassword !== user.password) {
        const message = 'Senha atual incorreta'
        return errorResponse(422, 'WRONG_PASSWORD', message, { errors: { currentPassword: message } })
      }
      user.password = newPassword
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.post(
    '/api/auth/logout',
    withScenario('auth.logout', () => new HttpResponse(null, { status: 204 })),
  ),
]
