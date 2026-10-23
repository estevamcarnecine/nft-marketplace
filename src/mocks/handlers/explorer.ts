import { http } from 'msw'
import type { ExplorerTransaction } from '@/types'
import { db } from '../db'
import { errorResponse, json, withScenario } from '../utils'

const GENESIS_BLOCK = 21_400_000

/**
 * Simulated block explorer. Like a real chain, a confirmed transaction is public, so this
 * exposes only on-chain facts (addresses, value, time), never the buyer's account data.
 */
export const explorerHandlers = [
  http.get(
    '/api/explorer/tx/:hash',
    withScenario('explorer.tx', ({ params }) => {
      const hash = String(params.hash).toLowerCase()
      const index = db.orders.findIndex((entry) => entry.order.txHash?.toLowerCase() === hash)
      const order = db.orders[index]?.order
      if (!order || order.status !== 'confirmed' || !order.txHash) {
        return errorResponse(404, 'TX_NOT_FOUND', 'Transação não encontrada')
      }
      const tx: ExplorerTransaction = {
        hash: order.txHash,
        network: order.wallet.network,
        status: 'confirmed',
        from: order.wallet.address,
        to: order.recipient,
        value: order.total,
        itemCount: order.lines.reduce((total, line) => total + line.quantity, 0),
        blockNumber: GENESIS_BLOCK + db.orders.length - index,
        timestamp: order.updatedAt,
      }
      return json({ ...tx })
    }),
  ),
]
