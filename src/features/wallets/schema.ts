import { z } from 'zod'
import { NETWORKS, WALLET_TYPES } from '@/types'
import type { NetworkId, Profile, WalletType } from '@/types'

const REQUIRED = 'Campo obrigatório'
const networkIds = NETWORKS.map((network) => network.id) as [NetworkId, ...NetworkId[]]
const walletTypes = WALLET_TYPES.map((type) => type.id) as [WalletType, ...WalletType[]]
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const ENS_NAME = /^[a-z0-9-]{3,63}\.eth$/i

export function isAddressFor(network: NetworkId | '', address: string): boolean {
  return network === 'solana' ? SOLANA_ADDRESS.test(address) : EVM_ADDRESS.test(address)
}

const network = z.union([z.enum(networkIds), z.literal('')])
const walletType = z.union([z.enum(walletTypes), z.literal('')])

export const primaryWalletSchema = z
  .object({
    displayName: z.string().trim().min(1, REQUIRED),
    walletNickname: z.string().trim().min(1, REQUIRED).max(40, 'Use até 40 caracteres'),
    network,
    profileName: z.string().trim().min(1, REQUIRED),
    walletAddress: z.string().trim().min(1, REQUIRED),
    secondaryWallet: z.string().trim(),
    walletType,
    referralCode: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^[A-Za-z0-9]{6,12}$/, 'Use de 6 a 12 letras ou números'),
    email: z.string().trim().min(1, REQUIRED).email('Informe um e-mail válido'),
    ensSuffix: z.literal('.eth'),
    ensName: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^[a-z0-9-]{3,63}$/i, 'Use de 3 a 63 letras, números ou hífen'),
  })
  .superRefine((value, context) => {
    if (!value.network) context.addIssue({ code: 'custom', path: ['network'], message: 'Selecione uma rede' })
    if (!value.walletType) context.addIssue({ code: 'custom', path: ['walletType'], message: 'Selecione uma carteira' })
    if (value.walletAddress && !isAddressFor(value.network, value.walletAddress)) {
      context.addIssue({ code: 'custom', path: ['walletAddress'], message: 'Endereço de carteira inválido' })
    }
    if (value.secondaryWallet && !ENS_NAME.test(value.secondaryWallet) && !isAddressFor(value.network, value.secondaryWallet)) {
      context.addIssue({ code: 'custom', path: ['secondaryWallet'], message: 'Informe um nome .eth ou um endereço válido' })
    }
  })

export type PrimaryWalletValues = z.infer<typeof primaryWalletSchema>

export function profileToPrimary(profile: Profile): PrimaryWalletValues {
  return {
    displayName: profile.displayName,
    walletNickname: profile.walletNickname,
    network: profile.network,
    profileName: profile.profileName,
    walletAddress: profile.walletAddress,
    secondaryWallet: profile.useAnotherWallet ? '' : profile.secondaryWallet,
    walletType: profile.walletType,
    referralCode: profile.referralCode,
    email: profile.email,
    ensSuffix: '.eth',
    ensName: profile.ensName,
  }
}

export const walletSchema = z
  .object({
    label: z.string().trim().min(1, REQUIRED).max(40, 'Use até 40 caracteres'),
    type: walletType,
    network,
    address: z.string().trim().min(1, REQUIRED),
  })
  .superRefine((value, context) => {
    if (!value.type) context.addIssue({ code: 'custom', path: ['type'], message: 'Selecione uma carteira' })
    if (!value.network) context.addIssue({ code: 'custom', path: ['network'], message: 'Selecione uma rede' })
    if (value.address && !isAddressFor(value.network, value.address)) {
      context.addIssue({ code: 'custom', path: ['address'], message: 'Endereço de carteira inválido' })
    }
  })

export type WalletFormValues = z.infer<typeof walletSchema>
