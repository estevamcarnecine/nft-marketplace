import { realtimeHandler } from '../socket'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { checkoutHandlers } from './checkout'
import { explorerHandlers } from './explorer'
import { profileHandlers } from './profile'
import { walletSessionHandlers } from './walletSessions'
import { walletHandlers } from './wallets'

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...explorerHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...walletSessionHandlers,
  realtimeHandler,
]