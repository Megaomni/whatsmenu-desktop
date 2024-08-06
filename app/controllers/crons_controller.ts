import Ws from '#services/websocket_service'
import Voucher from '#models/voucher'
import Cashier from '#models/cashier'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class CronsController {
  /**
   * Cancela os vouchers expirados.
   *
   * @param {HttpContext} response - O contexto HTTP.
   * @return {Promise<any>} A resposta contendo os vouchers cancelados.
   * @throws {Error} Caso ocorra um erro ao cancelar os vouchers.
   *
   */
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
      return response.status(500).json({ error: 'Failed to cancel expired vouchers.' })
    }
  }

  /**
   * Fecha os caixas que foram criados há mais de dois dias e ainda não foram fechados.
   *
   * @param {HttpContext} response - O contexto HTTP.
   * @return {Promise<any>} A resposta contendo os caixas fechados.
   * @throws {Error} Caso ocorra um erro ao fechar os caixas.
   */
  async closeCashiers({ response }: HttpContext): Promise<any> {
    try {
      const cashiers = await Cashier.query()
        .where('created_at', '<=', `${DateTime.now().minus({ days: 2 }).toFormat('yyyy-MM-dd')}%`)
        .whereNull('closed_at')

      for await (const cashier of cashiers) {
        cashier.closed_at = DateTime.now()
        await cashier.save()
      }
      response.json({ message: 'Caixas fechados com sucesso.', cashiers })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Failed to close cashiers.' })
    }
  }
}
