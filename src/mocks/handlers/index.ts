import { realtimeHandler } from '../socket'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { checkoutHandlers } from './checkout'
import { profileHandlers } from './profile'
import { walletSessionHandlers } from './walletSessions'
import { walletHandlers } from './wallets'

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...walletSessionHandlers,
  realtimeHandler,
]