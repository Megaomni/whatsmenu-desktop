import Ws from '#services/websocket_service'
import Voucher from '#models/voucher'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class CronsController {
  async cancelExpiredVouchers({ response }: HttpContext) {
    try {
      const vouchers = await Voucher.query().where(
        'expirationDate',
        'like',
        `${DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd')}%`
      )
      for (const voucher of vouchers) {
        voucher.status = 'cancelled'
        await voucher.save()
        await voucher.load('profile')

        const { profile, ...voucherJSON } = voucher.toJSON()

        Ws.io?.to(`${profile.slug}:voucher`).emit(`voucher:${voucherJSON.status}`, voucherJSON)
      }
      return response.json({ vouchers })
    } catch (error) {
      console.error(error)
    }
  }
}
