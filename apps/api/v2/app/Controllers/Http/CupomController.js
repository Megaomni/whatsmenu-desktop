'use strict'
const Cupom = use('App/Models/Cupom')
const moment = use('moment')

class CupomController {
  async index({ request, response, view, auth }) {
    try {
      console.log('Starting: ', { controller: 'CupomController', linha: 8, metodo: 'index' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const cupons = await profile.cupons().orderBy('id', 'desc').fetch()

      return response.json(cupons)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async store({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'CupomController', linha: 33, metodo: 'store' })
      const data = request.except(['_method', '_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      let cupom = await profile.cupons().where('code', data.code).first()

      if (!cupom) {
        data.profileId = profile.id
        data.value = this.transformValue(data.value)
        data.minValue = this.transformValue(data.minValue)
        data.status = 1
        data.deleted_at = null
        cupom = await Cupom.create(data)

        return response.json(cupom)
      } else {
        response.status(403)
        return response.json({
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

  async delete({ response, params, auth }) {
    try {
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const cupom = await profile.cupons().where('id', params.id).first()

      if (cupom) {
        const requests = await cupom.carts().fetch()

        if (requests.rows.length > 0) {
          cupom.deleted_at = moment().format('YYYY-MM-DD HH:mm:ss')
          cupom.code = `${cupom.code}-${cupom.deleted_at}`
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
      return response.status(500).json({ success: false, message: 'Erro interno do servidor ao excluir cupom.' })
    }
  }

  async playPause({ response, params, auth }) {
    try {
      console.log('Starting: ', { controller: 'CupomController', linha: 104, metodo: 'playPause' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const cupom = await profile.cupons().where('id', params.id).first()

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

  async activeDeactive({ response, auth }) {
    try {
      console.log('Starting: ', { controller: 'CupomController', linha: 126, metodo: 'activeDeactive' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      profile.options.activeCupom = !profile.options.activeCupom
      await profile.save()

      response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  transformValue(val) {
    console.log('Starting: ', { controller: 'CupomController', linha: 142, metodo: 'transformValue' })
    let value = val.replace('R$', '')
    value = value.replace(',', '.')
    value = value.split(' ').join('')

    return parseFloat(value.trim())
  }
}

module.exports = CupomController
