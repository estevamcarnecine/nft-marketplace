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
      const name = str(body.name)
      const email = str(body.email).toLowerCase()
      const password = typeof body.password === 'string' ? body.password : ''

      const errors: Record<string, string> = {}
      if (name.length < 2) errors.name = 'Informe seu nome'
      if (!isEmail(email)) errors.email = 'Informe um e-mail válido'
      if (password.length < 6) errors.password = 'A senha precisa ter ao menos 6 caracteres'
      if (Object.keys(errors).length > 0) return validationError(errors)

      if (db.users.some((u) => u.email === email)) {
        return errorResponse(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado')
      }

      const user: StoredUser = { id: nextId('user'), name, email, password }
      db.users.push(user)
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