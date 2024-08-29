import Client from '#models/client'
import Cupom from '#models/cupom'
import Profile from '#models/profile'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class CuponsController {
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.user

      if (!user) {
        return response.status(404).json(user)
      }
      await user.load('profile')
      await user.profile.load('cupons', (query) =>
        query.whereNull('deleted_at').orderBy('id', 'desc')
      )
      const cupons = user.profile.cupons

      return response.json(cupons)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async store({ auth, request, response }: HttpContext) {
    try {
      const data = request.except(['_method', '_csrf'])
      const user = auth.user
      const requiredCupomProps = ['code', 'value', 'minValue', 'type']
      if (!user) {
        return response.status(404).json(user)
      }
      if (!requiredCupomProps.every((key) => Object.keys(data).includes(key))) {
        return response.status(400).json({ message: 'Por favor, informe todos os dados do cupom!' })
      }
      await user.load('profile')
      await user.profile.load('firstOnlyCupom')

      await user.profile.load('cupons', (query) =>
        query.where({
          code: data.code,
        })
      )

      const alreadyCupom = user.profile.cupons
      if (data.firstOnly && user.profile.firstOnlyCupom) {
        return response.status(400).json({
          success: false,
          code: '400-01',
          message: 'O código do cupom é inválido, pois já existe um cupom firstOnly.',
        })
      }

      if (!alreadyCupom.length) {
        data.profileId = user.profile.id
        data.value = this.transformValue(data.value)
        data.minValue = this.transformValue(data.minValue)
        data.status = 1
        data.deleted_at = null
        const cupom = await Cupom.create(data)

        return response.json(cupom)
      } else {
        return response.status(403).json({
          success: false,
          code: '403-42',
          message: 'this code allready exist!',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async playPause({ response, params, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(404).json(user)
      }
      await user.load('profile')
      await user.profile.load('cupons', (query) => query.where('id', params.id))
      const cupom = user.profile.cupons[0]

      if (cupom) {
        cupom.status = !cupom.status
        await cupom.save()
        return response.json({ success: true })
      } else {
        response.status(404)
        return response.json({ success: false, message: 'cupom not found!' })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async activeDeactive({ response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(404).json(user)
      }
      await user.load('profile')
      user.profile.options.activeCupom = !user.profile.options.activeCupom
      await user.profile.save()

      response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async delete({ response, params, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(404).json({ success: false, message: 'Usuário não encontrado' })
      }
      await user.load('profile')
      await user.profile.load('cupons', (query) => query.where('id', params.id))
      const cupom = user.profile.cupons[0]

      if (cupom) {
        await cupom.load('carts')

        if (cupom.carts.length) {
          const now = DateTime.local()
          cupom.deleted_at = now
          cupom.code = `${cupom.code}-${now.toFormat('yyyy-MM-dd HH:mm:ss')}`
          await cupom.save()
        } else {
          await cupom.delete()
        }

        return response.json({ success: true })
      } else {
        response.status(404)
        return response.json({ success: true })
      }
    } catch (error) {
      console.error(error)
      return response
        .status(500)
        .json({ success: false, message: 'Erro interno do servidor ao excluir cupom.' })
    }
  }

  async getCupom({ params, request, response }: HttpContext) {
    try {
      const { code, clientId } = request.all()
      const profile = await Profile.findBy('slug', params.slug)
      if (!profile) {
        return response.status(404).json({ message: 'Profile inválido!' })
      }
      if (!profile?.options.activeCupom) {
        return response.status(404).json({
          code: '404-1',
          message: 'O cupom não é válido!',
        })
      }
      await profile.load('cupons', (query) => query.where('status', 1).whereNull('deleted_at'))
      const cupom = profile.cupons.find((c) => c.code.toUpperCase() === code.toUpperCase())

      if (cupom) {
        if (cupom.firstOnly && clientId) {
          const client = await Client.find(clientId)
          if (client?.last_requests.length) {
            return response.status(403).json({
              code: '403-1',
              message: 'Cupom válido somente para primeira compra!',
            })
          }
        }
        return response.json(cupom)
      } else {
        response.status(404)
        return response.json({
          code: '404-1',
          message: 'O cupom não é válido!',
        })
      }
    } catch (error) {
      console.error({
        date: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
        slug: params.slug,
        cupom: request.input('code'),
        error: error,
      })
      throw error
    }
  }
  transformValue(val: any) {
    let value = val.replace('R$', '')
    value = value.replace(',', '.')
    value = value.split(' ').join('')

    return Number.parseFloat(value.trim())
  }
}
