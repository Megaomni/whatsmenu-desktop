import Merchant from '#models/merchant'
import IfoodService from '#services/ifood_integration_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

export default class DiffHourMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const { timeZone, id, merchantId } = request.body()
    try {
      let merchant
      if (id) {
        merchant = await Merchant.findBy('wm_id', id)
      }
      if (merchantId) {
        merchant = await Merchant.findBy('merchantId', merchantId)
      }
      if (merchant) {
        const tokenTimeCreated = DateTime.fromISO(merchant.controls.dateTokenCreated, {
          zone: timeZone,
        })
        const now = DateTime.now()
        if (now.diff(tokenTimeCreated, 'hours').hours > 3) {
          const { accessToken, refreshToken } = await IfoodService.refreshToken(
            Number(merchant?.wm_id)
          )
          merchant.token = accessToken
          merchant.refresh_token = refreshToken
          merchant.controls = {
            dateTokenCreated: DateTime.local().toISO(),
          }
          await merchant.save()
        }
      }
      await next()
      const originalResponse = response?.content?.at(0)
      if (merchant && originalResponse && request.url() === '/ifood/polling') {
        response.json({ merchant, ...originalResponse })
      }
    } catch (error) {
      throw error
    }
  }
}
