import { http } from 'msw'
import { db, nextId, type StoredUser } from '../db'
import {
  authenticate,
  errorResponse,
  isEmail,
  json,
  publicUser,
  readJson,
  str,
  tokenFor,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'
import { PASSWORD_RULE, RESERVED_USERNAMES, USERNAME_PATTERN, isStrongPassword } from '../validation'

export const authHandlers = [
  http.post(
    '/api/auth/login',
    withScenario('auth.login', async ({ request }) => {
      const body = await readJson(request)
      const email = str(body.email).toLowerCase()
      const password = typeof body.password === 'string' ? body.password : ''

      const errors: Record<string, string> = {}
      if (!isEmail(email)) errors.email = 'Informe um e-mail válido'
      if (!password) errors.password = 'Informe sua senha'
      if (Object.keys(errors).length > 0) return validationError(errors)

      const user = db.users.find((u) => u.email === email && u.password === password)
      if (!user) return errorResponse(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos')

      return json({ token: tokenFor(user), user: publicUser(user) })
    }),
  ),

  http.post(
    '/api/auth/signup',
    withScenario('auth.signup', async ({ request }) => {
      const body = await readJson(request)
      const username = str(body.username)
      const email = str(body.email).toLowerCase()
      const password = typeof body.password === 'string' ? body.password : ''

      const errors: Record<string, string> = {}
      if (!USERNAME_PATTERN.test(username)) errors.username = 'Use de 3 a 20 letras, números ou _'
      if (!isEmail(email)) errors.email = 'Informe um e-mail válido'
      if (!isStrongPassword(password)) errors.password = PASSWORD_RULE
      if (Object.keys(errors).length > 0) return validationError(errors)

      if (db.users.some((u) => u.email === email)) {
        const message = 'Este e-mail já está cadastrado'
        return errorResponse(409, 'EMAIL_TAKEN', message, { errors: { email: message } })
      }
      const taken = [...db.profiles.values()].some(
        (profile) => profile.username.toLowerCase() === username.toLowerCase(),
      )
      if (taken || RESERVED_USERNAMES.includes(username.toLowerCase())) {
        const message = 'Este nome de usuário já está em uso'
        return errorResponse(409, 'USERNAME_TAKEN', message, { errors: { username: message } })
      }

      const user: StoredUser = { id: nextId('user'), name: username, email, password }
      db.users.push(user)
      db.profiles.set(user.id, {
        displayName: username,
        username,
        profileName: username,
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
      })
      return json({ token: tokenFor(user), user: publicUser(user) }, 201)
    }),
  ),

  http.get(
    '/api/auth/me',
    withScenario('auth.me', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()
      return json(publicUser(user))
    }),
  ),
]