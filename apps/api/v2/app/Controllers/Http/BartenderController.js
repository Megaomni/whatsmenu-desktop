'use strict'

const Bartender = use('App/Models/Bartender')
const Profile = use('App/Models/Profile')
const Table = use('App/Models/Table')
const { DateTime } = require('luxon')
const Hash = use('Hash')
const moment = require('moment')

class BartenderController {
  async create({ request, response, auth }) {
    console.log('Starting: ', { controller: 'BartenderController', linha: 10, metodo: 'create' })
    try {
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const { password, ...body } = request.all()
      const { data } = body

      data.profileId = profile.id

      const bartender = await Bartender.create(data)

      return response.json(bartender)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async list({ auth, response, params }) {
    console.log('Starting: ', { controller: 'BartenderController', linha: 28, metodo: 'list' })
    try {
      let profile
      let bartenders

      if (!params.profileId) {
        const user = await auth.getUser()
        profile = await user.profile().fetch()
      } else {
        profile = await Profile.find(params.profileId)
      }

      bartenders = await Bartender.query().where('profileId', profile.id).fetch()

      return response.json(bartenders)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async update({ request, response }) {
    console.log('Starting: ', { controller: 'BartenderController', linha: 55, metodo: 'update' })
    try {
      const { password, ...body } = request.all()
      const { data: update } = body

      delete update.cashiers
      const bartender = await Bartender.find(update.id)

      if (!update.password) {
        update.password = bartender.password
      }

      if (update.password.trim() === '') {
        delete update.password
      }
      // const hasActive = await this.checkActiveCashier(bartender)

      // if (hasActive) {
      //   return response.status(401).json({ message: "O operador possui um caixa aberto no momento, finalize o caixa para poder realizar alterações neste operador" })
      // }

      bartender.merge(update)

      await bartender.save()

      return response.json(bartender)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async auth({ request, response }) {
    console.log('Starting: ', { controller: 'BartenderController', linha: 79, metodo: 'auth' })
    try {
      const { bartenderId, password, tableId, type } = request.except(['_csrf'])

      const bartender = await Bartender.query()
        .where({
          id: bartenderId,
        })
        .with('activeCashier.carts')
        .first()
      if (bartender) {
        if (type === 'pdv' && bartender.controls.type === 'default') {
          return response.status(403).json({ success: false, message: 'Operador não autorizado' })
        }
        if (!bartender.status) {
          return response.status(403).json({ success: false, message: 'No momento você não pode fazer pedidos' })
        }

        const allowAccess = await Hash.verify(password, bartender.password)
        let table

        if (allowAccess) {
          bartender.password = ''
          if (tableId) {
            table = await Table.query()
              .where('id', tableId)
              .with('opened', (openedQuery) =>
                openedQuery.with('commands', (commandQuery) =>
                  commandQuery.where('status', 1).with('carts', (cartsQuery) => cartsQuery.where('type', 'T').with('itens'))
                )
              )
              .first()
          }
          return response.json({
            bartender,
            table,
          })
        }
      }

      return response.status(403).json({ success: false, message: 'Senha Inválida' })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async delete({ request, response }) {
    console.log('Starting: ', { controller: 'BartenderController', linha: 90, metodo: 'delete' })
    try {
      const { password, ...body } = request.all()
      const { data } = body

      const { bartenderId } = data

      const bartender = await Bartender.find(bartenderId)

      const hasActive = await this.checkActiveCashier(bartender)

      if (hasActive) {
        return response
          .status(401)
          .json({ message: 'O operador possui um caixa aberto no momento, finalize o caixa para poder remover este operador' })
      }

      bartender.deleted_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      bartender.name = bartender.name + bartender.deleted_at
      await bartender.save()

      return response.json(bartender)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async checkActiveCashier(bartender) {
    if (bartender.type !== 'default') {
      const cashier = await bartender.activeCashier().fetch()

      return !!cashier
    }
    return false
  }
}

module.exports = BartenderController
