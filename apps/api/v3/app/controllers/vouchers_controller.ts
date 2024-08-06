import Ws from '#services/websocket_service'
import Voucher from '#models/voucher'
import Client from '#models/client'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class VouchersController {
  async config({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado.' })
    }
    await user.load('profile')

    const status = request.input('status', user.profile.options.voucher[0].status)
    const percentage = request.input('percentage', user.profile.options.voucher[0].percentage)
    const expirationDays = request.input(
      'expirationDays',
      user.profile.options.voucher[0].expirationDays
    )

    const voucherConfig = {
      status: status,
      percentage: percentage,
      expirationDays: expirationDays,
      created_at: DateTime.local().setLocale('pt-br').toISO(),
    }

    user.profile.options.voucher.unshift(voucherConfig)
    await user.profile.save()

    return response.json({
      message: 'Configurações de cashback atualizadas com sucesso.',
      voucher: user.profile.options.voucher,
    })
  }

  async toggleCashback({ response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(404).json({ message: 'Usuário não encontrado.' })
      }
      await user.load('profile')
      if (user.profile.options.voucher.length > 0) {
        user.profile.options.voucher[0].status = !user.profile.options.voucher[0].status
      }
      await user.profile.save()

      let status = ''
      if (user.profile.options.voucher[0].status) {
        status = 'ativado'
      } else {
        status = 'desativado'
      }

      response.json({ success: true, message: `Cashback ${status} com sucesso.` })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async create({ request, response }: HttpContext) {
    try {
      const { clientId, profileId, expirationDays, value, status } = request.all()

      if (value === 0) {
        return response.status(403).json({ message: 'Não é possível criar um voucher zerado.' })
      }

      const client = await Client.find(clientId)
      if (!client) {
        return response.status(404).json({ message: 'Cliente não encontrado ou inválido.' })
      }

      const voucher = await Voucher.create({
        profileId,
        clientId,
        status: status ?? 'avaliable',
        value,
        expirationDate: DateTime.local().plus({ days: expirationDays }),
      })

      await voucher.load('profile')
      await voucher.load('client')
      await voucher.client.load('vouchers')

      const { profile, ...voucherJSON } = voucher.toJSON()

      Ws.io?.to(`${profile.slug}:voucher`).emit(`voucher:${voucherJSON.status}`, voucherJSON)

      return response.json({ message: 'Voucher criado com sucesso.', voucher: voucher })
    } catch (error) {
      console.error('Erro ao criar o voucher:', error)
      throw error
    }
  }
  async update({ request, response }: HttpContext) {
    try {
      const { id } = request.params()
      const { expirationDays, value, status } = request.all()

      const voucher = await Voucher.find(id)

      if (!voucher) {
        return response.status(404).json({ message: 'Voucher não encontrado ou inválido.' })
      }

      if (value === 0) {
        return response.status(403).json({ message: 'Não é possível criar um voucher zerado.' })
      }

      if (!Object.keys(request.all()).length) {
        return response.status(400).json({ message: 'Nenhum dado foi informado.' })
      }

      voucher.expirationDate = voucher.expirationDate.plus({ days: expirationDays })
      voucher.value = value
      voucher.status = status
      await voucher.save()
      await voucher.load('profile')

      const { profile, ...voucherJSON } = voucher.toJSON()

      Ws.io?.to(`${profile.slug}:voucher`).emit(`voucher:${voucherJSON.status}`, voucherJSON)

      return response.json({ message: 'Voucher atualizado com sucesso.', voucher })
    } catch (error) {
      console.error('Erro ao atualizar o voucher:', error)
      throw error
    }
  }
}
