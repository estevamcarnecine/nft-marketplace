import { z } from 'zod'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { CollectorInput, NetworkId, Profile } from '@/types'

const REQUIRED = 'Campo obrigatório'
const networkIds = NETWORKS.map((network) => network.id) as [NetworkId, ...NetworkId[]]
const walletTypes = WALLET_TYPES.map((type) => type.id) as [
  (typeof WALLET_TYPES)[number]['id'],
  ...(typeof WALLET_TYPES)[number]['id'][],
]

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const ENS_NAME = /^[a-z0-9-]{3,63}\.eth$/i

function isAddressFor(network: NetworkId | '', address: string): boolean {
  if (network === 'solana') return SOLANA_ADDRESS.test(address)
  return EVM_ADDRESS.test(address)
}

/** Client mirror of the server rules in `src/mocks/validation.ts`; the API stays the authority. */
export const checkoutSchema = z
  .object({
    displayName: z.string().trim().min(1, REQUIRED).max(60, 'Use até 60 caracteres'),
    username: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^[a-z0-9_]{3,20}$/i, 'Use de 3 a 20 letras, números ou _'),
    profileName: z.string().trim().min(1, REQUIRED),
    email: z.string().trim().min(1, REQUIRED).email('Informe um e-mail válido'),
    network: z.union([z.enum(networkIds), z.literal('')]),
    walletType: z.union([z.enum(walletTypes), z.literal('')]),
    walletAddress: z.string().trim().min(1, REQUIRED),
    useAnotherWallet: z.boolean(),
    secondaryWallet: z.string().trim(),
    ensSuffix: z.literal('.eth'),
    referralCode: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^[A-Za-z0-9]{6,12}$/, 'Use de 6 a 12 letras ou números'),
    note: z.string().max(500, 'Use até 500 caracteres'),
  })
  .superRefine((value, context) => {
    if (!value.network) context.addIssue({ code: 'custom', path: ['network'], message: 'Selecione uma rede' })
    if (!value.walletType) {
      context.addIssue({ code: 'custom', path: ['walletType'], message: 'Selecione uma carteira' })
    }
    if (value.walletAddress && !isAddressFor(value.network, value.walletAddress)) {
      context.addIssue({ code: 'custom', path: ['walletAddress'], message: 'Endereço de carteira inválido' })
    }
    if (value.useAnotherWallet && !value.secondaryWallet) {
      context.addIssue({ code: 'custom', path: ['secondaryWallet'], message: 'Informe a outra carteira' })
    } else if (
      value.secondaryWallet &&
      !ENS_NAME.test(value.secondaryWallet) &&
      !isAddressFor(value.network, value.secondaryWallet)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['secondaryWallet'],
        message: 'Informe um nome .eth ou um endereço válido',
      })
    }
  })

export type CheckoutForm = z.infer<typeof checkoutSchema>

export const EMPTY_CHECKOUT: CheckoutForm = {
  displayName: '',
  username: '',
  profileName: '',
  email: '',
  network: '',
  walletType: '',
  walletAddress: '',
  useAnotherWallet: false,
  secondaryWallet: '',
  ensSuffix: '.eth',
  referralCode: '',
  note: '',
}

export function profileToForm(profile: Profile): CheckoutForm {
  return {
    displayName: profile.displayName,
    username: profile.username,
    profileName: profile.profileName,
    email: profile.email,
    network: profile.network,
    walletType: profile.walletType,
    walletAddress: profile.walletAddress,
    useAnotherWallet: profile.useAnotherWallet,
    secondaryWallet: profile.secondaryWallet,
    ensSuffix: '.eth',
    referralCode: profile.referralCode,
    note: '',
  }
}

/** Narrows a validated form into the API payload. */
export function toCollector(values: CheckoutForm): CollectorInput | null {
  if (!values.network || !values.walletType) return null
  return {
    ...values,
    network: values.network,
    walletType: values.walletType,
    referralCode: values.referralCode.toUpperCase(),
  }
}
