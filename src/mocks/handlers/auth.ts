import { HttpResponse, http } from 'msw'
import { mergeGuestCart } from '../carts'
import { db, nextId, type StoredUser } from '../db'
import { bearerToken, checkSession, createSession, hashPassword, newSalt, revokeSession, verifyPassword } from '../session'
import {
  authenticate,
  errorResponse,
  isEmail,
  json,
  publicUser,
  readJson,
  str,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'
import { PASSWORD_RULE, RESERVED_USERNAMES, USERNAME_PATTERN, isStrongPassword } from '../validation'

function sessionResponse(user: StoredUser, status = 200) {
  const session = createSession(user.id)
  return json({ token: session.token, expiresAt: new Date(session.expiresAt).toISOString(), user: publicUser(user) }, status)
}

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

      const user = db.users.find((candidate) => candidate.email === email)
      if (!user || !(await verifyPassword(user, password))) {
        return errorResponse(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos')
      }

      mergeGuestCart(str(body.guestCartId) || undefined, user.id)
      return sessionResponse(user)
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

      const salt = newSalt()
      const user: StoredUser = {
        id: nextId('user'),
        name: username,
        email,
        salt,
        passwordHash: await hashPassword(salt, password),
      }
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
      mergeGuestCart(str(body.guestCartId) || undefined, user.id)
      return sessionResponse(user, 201)
    }),
  ),

  http.get(
    '/api/auth/session',
    withScenario('auth.session', ({ request }) => {
      const session = checkSession(request)
      if (session.status !== 'valid') return unauthorized(request)
      return json({ user: publicUser(session.user), expiresAt: new Date(session.expiresAt).toISOString() })
    }),
  ),

  http.get(
    '/api/auth/me',
    withScenario('auth.me', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized(request)
      return json(publicUser(user))
    }),
  ),

  http.post(
    '/api/auth/logout',
    withScenario('auth.logout', ({ request }) => {
      // Idempotent: logging out an unknown or expired session still succeeds.
      const token = bearerToken(request)
      if (token) revokeSession(token)
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
