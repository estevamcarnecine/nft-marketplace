import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { cartKey } from '@/features/cart/api'
import { getToken, onTokenChange } from '@/lib/auth'
import { connectSocket, disconnectSocket, type RealtimeSocket } from '@/lib/socket'
import { applyNftUpdated, applyOrderUpdated } from './apply'
import { acceptEvent } from './gate'
import { clearCartNotices } from './notices'
import { setRealtimeConnected } from './status'

/**
 * One socket for the whole app. It is bound to the current session (so order events reach only
 * their owner), rebound on login/logout, and on every reconnect the screens re-read REST to catch
 * up with whatever happened while it was down.
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let disposed = false
    let release = () => {}

    function listen(socket: RealtimeSocket) {
      let connectedBefore = false

      function subscribeSession(token: string | null) {
        if (!socket.connected) return
        if (token) socket.emit('session.subscribe', { token })
        else socket.emit('session.unsubscribe')
      }

      function handleConnect() {
        setRealtimeConnected(true)
        subscribeSession(getToken())
        if (connectedBefore) {
          void queryClient.invalidateQueries({ queryKey: ['nfts'] })
          void queryClient.invalidateQueries({ queryKey: cartKey })
          void queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
        connectedBefore = true
      }

      function handleDisconnect() {
        setRealtimeConnected(false)
      }

      if (socket.connected) handleConnect()
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('nft.updated', (event) => {
        if (acceptEvent(event)) applyNftUpdated(queryClient, event)
      })
      socket.on('order.updated', (event) => {
        if (acceptEvent(event)) applyOrderUpdated(queryClient, event)
      })
      const stopTokenWatch = onTokenChange((token) => {
        // Another user's notices must not survive a session change.
        clearCartNotices()
        subscribeSession(token)
      })

      release = () => {
        stopTokenWatch()
        socket.off()
      }
    }

    void connectSocket().then((socket) => {
      if (!disposed) listen(socket)
    })

    return () => {
      disposed = true
      release()
      disconnectSocket()
      setRealtimeConnected(false)
    }
  }, [queryClient])

  return null
}
