import Cart from '#models/cart'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ReportsController {
  async top10({ auth, request, response }: HttpContext) {
    try {
      const { user } = auth
      const { startDate, endDate } = request.all()

      let clientsMaxTotal
      let clientsMaxQuantity
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' })
      }
      await user.load('profile')
      const { profile } = user
      if (!profile) {
        return response.status(401).json({ error: 'Unauthorized' })
      }

      if (startDate && endDate) {
        const top10BaseQuery = async (orderBy: string) => {
          const carts = await Cart.query()
            .where('profileId', profile.id)
            .whereBetween('created_at', [startDate, endDate])
            .groupBy('clientId')
            .select(['clientId', db.raw('SUM(total + taxDelivery) as total')])
            .count('* as quantity')
            .orderBy(orderBy, 'desc')
            .limit(10)

          const result = await Promise.all(
            carts.map(async (cart) => {
              await cart.load('client')
              if (cart.client) {
                cart.client.controls.requests = {
                  total: cart.total,
                  quantity: cart.$extras.quantity,
                }
              }

              return cart.client
            })
          )
          return result.filter((client) => client)
        }
        clientsMaxTotal = await top10BaseQuery('total')
        clientsMaxQuantity = await top10BaseQuery('quantity')
      } else {
        await profile.load('clients', (query) => {
          query.orderByRaw("JSON_EXTRACT(controls, '$.requests.total') DESC").limit(10)
        })
        clientsMaxTotal = profile.clients
        await profile.load('clients', (query) => {
          query.orderByRaw("JSON_EXTRACT(controls, '$.requests.quantity') DESC").limit(10)
        })
        clientsMaxQuantity = profile.clients
      }

      return response.json({ clientsMaxTotal, clientsMaxQuantity })
    } catch (error) {
      console.error(error)
    }
  }
}
