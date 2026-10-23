import { http } from 'msw'
import type { Profile } from '@/types'
import { db, type StoredUser } from '../db'
import {
  authenticate,
  isEmail,
  isNetwork,
  isValidAddress,
  isWalletType,
  json,
  readJson,
  str,
  unauthorized,
  validationError,
  withScenario,
} from '../utils'
import { RESERVED_USERNAMES } from '../validation'


function emptyProfile(user: StoredUser): Profile {
  return {
    displayName: user.name,
    username: '',
    profileName: '',
    email: user.email,
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

export const profileHandlers = [
  http.get(
    '/api/profile',
    withScenario('profile.get', ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()
      return json({ ...(db.profiles.get(user.id) ?? emptyProfile(user)) })
    }),
  ),

  http.put(
    '/api/profile',
    withScenario('profile.update', async ({ request }) => {
      const user = authenticate(request)
      if (!user) return unauthorized()

      const input = await readJson(request)
      const displayName = str(input.displayName)
      const username = str(input.username)
      const profileName = str(input.profileName)
      const email = str(input.email).toLowerCase()
      const network = str(input.network)
      const walletType = str(input.walletType)
      const walletAddress = str(input.walletAddress)
      const secondaryWallet = str(input.secondaryWallet)
      const ensName = str(input.ensName)
      const referralCode = str(input.referralCode).toUpperCase()
      const note = str(input.note)

      const errors: Record<string, string> = {}
      const required = { displayName, username, profileName, email, walletAddress, ensName, referralCode }
      for (const [field, value] of Object.entries(required)) {
        if (!value) errors[field] = 'Campo obrigatório'
      }

      if (!isNetwork(network)) errors.network = 'Selecione uma rede'
      if (!isWalletType(walletType)) errors.walletType = 'Selecione uma carteira'

      if (!errors.email && !isEmail(email)) errors.email = 'Informe um e-mail válido'
      if (!errors.username && !/^[a-z0-9_]{3,20}$/i.test(username)) {
        errors.username = 'Use de 3 a 20 letras, números ou _'
      }
      if (!errors.username && RESERVED_USERNAMES.includes(username.toLowerCase())) {
        errors.username = 'Este nome de usuário já está em uso'
      }
      if (!errors.referralCode && !/^[A-Z0-9]{6,12}$/.test(referralCode)) {
        errors.referralCode = 'Use de 6 a 12 letras maiúsculas ou números'
      }
      if (!errors.ensName && !/^[a-z0-9-]{3,63}$/i.test(ensName)) {
        errors.ensName = 'Nome ENS inválido'
      }
      if (isNetwork(network) && !errors.walletAddress && !isValidAddress(network, walletAddress)) {
        errors.walletAddress = 'Endereço de carteira inválido'
      }
      if (
        isNetwork(network) &&
        secondaryWallet &&
        !/\.eth$/i.test(secondaryWallet) &&
        !isValidAddress(network, secondaryWallet)
      ) {
        errors.secondaryWallet = 'Informe um nome .eth ou um endereço válido'
      }
      if (note.length > 500) errors.note = 'Use até 500 caracteres'

      if (!isNetwork(network) || !isWalletType(walletType) || Object.keys(errors).length > 0) {
        return validationError(errors)
      }

      const profile: Profile = {
        displayName,
        username,
        profileName,
        email,
        network,
        walletType,
        walletAddress,
        useAnotherWallet: input.useAnotherWallet === true,
        secondaryWallet,
        ensName,
        ensSuffix: '.eth',
        referralCode,
        note,
        walletNickname: db.profiles.get(user.id)?.walletNickname ?? '',
        avatarUrl: db.profiles.get(user.id)?.avatarUrl ?? null,
      }
      db.profiles.set(user.id, profile)
      return json({ ...profile })
    }),
  ),
]