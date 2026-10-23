import type { CollectorInput } from '@/types'
import { isEmail, isNetwork, isRecord, isValidAddress, isWalletType, str } from './utils'

export type Validation<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> }

const REQUIRED = 'Campo obrigatório'
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/i
export const REFERRAL_PATTERN = /^[A-Z0-9]{6,12}$/
const ENS_PATTERN = /^[a-z0-9-]{3,63}\.eth$/i
export const NOTE_MAX = 500

/** Server-side rules for the "Perfil do colecionador" block of the payment screen. */
export function validateCollector(raw: unknown): Validation<CollectorInput> {
  const input = isRecord(raw) ? raw : {}
  const displayName = str(input.displayName)
  const username = str(input.username)
  const profileName = str(input.profileName)
  const email = str(input.email).toLowerCase()
  const network = str(input.network)
  const walletType = str(input.walletType)
  const walletAddress = str(input.walletAddress)
  const useAnotherWallet = input.useAnotherWallet === true
  const secondaryWallet = str(input.secondaryWallet)
  const referralCode = str(input.referralCode).toUpperCase()
  const note = str(input.note)

  const errors: Record<string, string> = {}
  if (!displayName) errors.displayName = REQUIRED
  if (!profileName) errors.profileName = REQUIRED
  if (!username) errors.username = REQUIRED
  else if (!USERNAME_PATTERN.test(username)) errors.username = 'Use de 3 a 20 letras, números ou _'
  if (!email) errors.email = REQUIRED
  else if (!isEmail(email)) errors.email = 'Informe um e-mail válido'
  if (!isNetwork(network)) errors.network = 'Selecione uma rede'
  if (!isWalletType(walletType)) errors.walletType = 'Selecione uma carteira'
  if (!walletAddress) errors.walletAddress = REQUIRED
  else if (isNetwork(network) && !isValidAddress(network, walletAddress)) {
    errors.walletAddress = 'Endereço de carteira inválido'
  }
  if (useAnotherWallet && !secondaryWallet) errors.secondaryWallet = 'Informe a outra carteira'
  else if (
    secondaryWallet &&
    !ENS_PATTERN.test(secondaryWallet) &&
    !(isNetwork(network) && isValidAddress(network, secondaryWallet))
  ) {
    errors.secondaryWallet = 'Informe um nome .eth ou um endereço válido'
  }
  if (input.ensSuffix !== '.eth') errors.ensSuffix = 'Selecione o sufixo ENS'
  if (!referralCode) errors.referralCode = REQUIRED
  else if (!REFERRAL_PATTERN.test(referralCode)) {
    errors.referralCode = 'Use de 6 a 12 letras maiúsculas ou números'
  }
  if (note.length > NOTE_MAX) errors.note = `Use até ${NOTE_MAX} caracteres`

  if (Object.keys(errors).length > 0 || !isNetwork(network) || !isWalletType(walletType)) {
    return { ok: false, errors }
  }
  return {
    ok: true,
    value: {
      displayName,
      username,
      profileName,
      email,
      network,
      walletType,
      walletAddress,
      useAnotherWallet,
      secondaryWallet,
      ensSuffix: '.eth',
      referralCode,
      note,
    },
  }
}
