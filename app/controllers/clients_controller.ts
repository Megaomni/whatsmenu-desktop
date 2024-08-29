import Client from '#models/client'
import Profile from '#models/profile'
import Ws from '#services/websocket_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class ClientsController {
  async list({ params, request, response }: HttpContext) {
    try {
      const { slug } = params
      const profile = await Profile.findByOrFail('slug', slug)

      const query = Object.entries(request.qs())

      if (query.length) {
        const [[filter, value]] = query

        switch (filter) {
          case 'whatsapp':
            await profile.load('clients', (client) => {
              client.where('whatsapp', value)
              client.preload('addresses')
              client.preload('vouchers')
            })
            break
          case 'name':
            await profile.load('clients', (client) => {
              client.where('name', 'like', `%${value}%`)
              client.preload('addresses')
              client.preload('vouchers')
            })
            break
          default:
            await profile.load('clients', (client) => {
              client.preload('addresses')
              client.preload('vouchers')
            })
            break
        }
      } else {
        await profile.load('clients', (client) => {
          client.preload('addresses')
          client.preload('vouchers')
        })
      }

      if (!profile.clients.length) {
        return response.status(404).json({ message: 'Nenhum cliente encontrado' })
      }

      for (const client of profile.clients) {
        if (client.controls.asaas && client.controls.asaas.cards.length) {
          client.controls.asaas.cards.forEach((card) => {
            delete card.creditCardToken
            delete card.uuid
          })
        }
      }

      return response.json(profile.clients)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async findClient({ request, params, response }: HttpContext) {
    try {
      const { whatsapp, profileId } = request.all()
      const { slug, clientId } = params
      if (whatsapp === 'undefined' && !clientId) {
        return response.status(400).json({ message: 'Whatsapp não informado' })
      }

      if (profileId === 'undefined' || slug === 'undefined') {
        return response.status(400).json({ message: 'Profile não informado' })
      }

      let profile: Profile | null
      if (slug) {
        profile = await Profile.findBy('slug', slug)
      } else {
        profile = await Profile.findBy('id', profileId)
      }
      if (!profile) {
        return response.status(404).json({ message: 'Nenhum perfil encontrado' })
      }

      await profile.load('clients', (client) => {
        client.where((query) => {
          if (clientId) {
            query.where('id', clientId)
          }
          if (whatsapp) {
            query.where('whatsapp', whatsapp)
          }
        })
      })

      const client = profile.clients[0]

      if (!client) {
        return response.status(404).json({ message: 'Nenhum cliente encontrado' })
      }

      await client.load('addresses', (address) => {
        address.whereNull('deleted_at')
      })

      await client.load('vouchers')
      await client.load('carts', (carts) =>
        carts
          .whereIn(
            'id',
            client.last_requests.map((cart) => cart.id)
          )
          .preload('cupom')
      )
      if (client.controls.asaas && client.controls.asaas.cards.length) {
        client.controls.asaas.cards.forEach((card) => {
          delete card.creditCardToken
          delete card.uuid
        })
      }

      client.last_requests = client.carts

      return response.status(200).json({ client })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateVouchers({ response, params }: HttpContext) {
    try {
      const { clientId } = params
      const client = await Client.find(clientId)
      if (!client) {
        return response.status(404).json({ message: 'Nenhum cliente encontrado' })
      }
      await client.load('vouchers')
      for (const voucher of client.vouchers) {
        voucher.status = 'used'
        await voucher.save()
        await voucher.load('profile')
        await voucher.load('client')
        await voucher.client.load('vouchers')

        const { profile, ...voucherJSON } = voucher.toJSON()

        Ws.io?.to(`${profile.slug}:voucher`).emit(`voucher:${voucherJSON.status}`, voucherJSON)
      }

      return response.status(200).json({ client })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
