'use strict'

const Database = require('@adonisjs/lucid/src/Database')
const { DateTime } = require('luxon')

const User = use('App/Models/User')
const UserPlan = use('App/Models/UserPlan')
const moment = use('moment')
const Hash = use('Hash')
const Ws = use('Ws')
const Logger = use('Logger')

class UserController {
  async index({ response, auth, view }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 10, metodo: 'index' })
      const user = await auth.getUser()
      return response.send(
        view.render('inner.user.index', {
          profile: await user.profile().fetch(),
        })
      )
    } catch (error) {
      console.error({
        date: moment().format(),
        user: auth.user.id,
        error: error,
      })
      response.send(error)
    }
  }

  async updPassword({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 29, metodo: 'updPassword' })
      const { password, old_password } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      if (old_password) {
        const isSame = await Hash.verify(old_password, user.toJSON().password)
        if (isSame) {
          user.password = password
          user.controls.attempts = 0
          user.controls.lastUpdatePassword = DateTime.local().toISO()
          await user.save()
          const profileTopic = Ws.getChannel('profile:*').topic(`profile:${profile.slug}`)
          if (profileTopic) {
            profileTopic.broadcast(`forceLogout`, { forceLogout: true })
            await auth.authenticator('jwt').revokeTokens()
          }
          return response.status(200).json(user)
        } else {
          response.status(403)
          return response.json({
            code: '403-39',
            message: 'Not Permission',
          })
        }
      } else {
        user.password = password
        user.controls.attempts = 0
        await user.save()
        return response.route('request.index')
      }
      // return response.json({
      //   success: true,
      //   message: 'success on alter password!'
      // })
    } catch (error) {
      console.error({
        date: moment().format(),
        user: auth.user.id,
        error: error,
      })
      response.status(500)
      response.send(error)
    }
  }

  static async getAllSupportUsers() {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 67, metodo: 'getAllSupportUsers' })
      return await User.query().whereRaw('controls->"$.type" = "support"').fetch()
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async setFirstAccess({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 78, metodo: 'setFirstAccess' })
      const user = await auth.getUser()

      if (!user.controls.firstAccess) {
        user.controls.firstAccess = moment().format()
        await user.save()
      }

      return response.json(user.controls.firstAccess)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUser({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 96, metodo: 'getUser' })
      const user = await auth.getUser()
      return response.json(user)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async fixEmail({ response }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 107, metodo: 'fixEmail' })
      const users = await User.all()
      // const all = users.toJSON()
      // return response.json(all.map(u => u.email = u.email.split(`${u.id}_`)[0]))

      for (let user of users.rows) {
        user.email = `${user.id}_${user.email.split(`${user.id}_`)[0]}`
        await user.save()
      }
      return response.json(users.rows.map((user) => user.email))
    } catch (error) {
      throw error
    }
  }

  async setUserFlexPlan({ response }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 126, metodo: 'setUserFlexPlan' })
      const users = await User.all()

      for (let user of users.rows) {
        const plans = await user.plans().fetch()
        if (!plans || plans.rows.length == 0) {
          await UserPlan.create({
            userId: user.id,
            flexPlanId: 1,
          })
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async forgotUpdPassword({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 147, metodo: 'forgotUpdPassword' })
      const { password, password_confirm, user_email } = request.all()

      const user = await User.findBy('email', user_email)

      if (password === '123456') return response.status(403)

      if (password !== password_confirm) return response.status(403)

      user.password = password
      if (user.controls.recovery) {
        user.controls.recovery.token = null
      }
      user.controls.attempts = 0
      user.controls.forceSecurity = false

      await user.save()

      return response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUserPlans({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'UserController', linha: 172, metodo: 'getUserPlans' })
      const user = await User.find(params.userId)
      const plans = await user.plans().fetch()

      return response.json(plans)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async setUserIdOneSignal({ request, response }) {
    try {
      const user = await User.find(request.input(user))
      user.controls.print.app.id = request.input('player')
      await user.save()

      response.json({ success: true, user: user })
    } catch (error) {
      throw error
    }
  }

  async updateControls({ request, response, auth }) {
    console.log('Starting: ', { controller: 'updateControls', linha: 215, metodo: 'updateControls' })
    const user = await auth.getUser()
    const data = request.except(['_csrf'])

    try {
      if (typeof user.controls === 'string') {
        user.controls = JSON.parse(user.controls)
      }
      if (data) {
        user.controls = {
          ...user.controls,
          ...data,
          beta: !user.controls.beta,
        }
      }
      await user.save()

      return response.json({
        update: 'success',
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getTotalUsersBetaNext({ response }) {
    console.log('Starting: ', { controller: 'getTotalUsersBetaNext', linha: 215, metodo: 'getTotalUsersBetaNext' })
    try {
      const totalUsersFromNext = await User.query().whereNot('controls', 'like', `%"beta":%true%`).fetch()
      console.log('total', totalUsersFromNext.rows.length)
      const total = totalUsersFromNext.rows.length

      return response.json(total)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUserInfo({ params, response }) {
    try {
      const user = await User.find(params.id)

      if (user) {
        return response.json({
          success: true,
          beta: String(user.controls.beta),
          typeUser: user.controls.type,
        })
      } else {
        return response.json({ success: false })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUserPaymentInfo({ auth, response }) {
    try {
      const user = await auth.getUser()
      return response.json(user.controls.paymentInfo)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async deleteUserAlreadyMigrated({ request, response }) {
    try {
      const { securityKey, usersIds } = request.all()

      if (securityKey !== 'WhatsMenuDev*2023') {
        return response.status(404).json({ message: 'Informe a senha' })
      }

      if (!usersIds || !usersIds.length) {
        return response.status(400).json({ message: 'Informe os ids dos usuários as serem deletados dentro de um array' })
      }

      Logger.info('Buscando usuários...')
      const users = await User.query()
        .whereIn('id', usersIds)
        .with('profiles', (profileQuery) => {
          profileQuery
            .with('allCategories', (categoryQuery) => {
              categoryQuery.with('product').with('allProducts')
            })
            .with('carts')
            .with('tables.tablesOpened')
            .with('bartenders')
            .with('clients')
        })
        .fetch()

      for (const user of users.rows) {
        for (const profile of user.$relations.profiles.rows) {
          Logger.info(profile.id)
          for await (const cart of profile.$relations.carts.rows) {
            await cart.itens().delete()
          }
          await profile.carts().delete()
          Logger.info('Carts deletados')
          await profile.requests().delete()
          Logger.info('Requests deletados')
          for await (const table of profile.$relations.tables.rows) {
            for await (const opened of table.$relations.tablesOpened.rows) {
              await opened.commands().delete()
            }
            await table.tablesOpened().delete()
          }
          Logger.info('Commands deletados')
          Logger.info('Openeds deletados')
          await profile.tables().delete()
          Logger.info('Tables deletadas')

          for await (const category of profile.$relations.allCategories.rows) {
            if (category.type === 'default') {
              for await (const product of category.$relations.allProducts.rows) {
                await product.complements().detach()
                await product.complements().delete()
              }
              await category.allProducts().delete()
              Logger.info('Complements deletados')
              Logger.info('Products deletados')
            }
            if (category.type === 'pizza' && category.$relations.product) {
              await category.$relations.product.complements().detach()
              await category.$relations.product.complements().delete()
              await category.product().delete()
              Logger.info('Complements deletada')
              Logger.info('Pizza deletada')
            }
          }
          await profile.allCategories().delete()
          Logger.info('Products deletados')
          Logger.info('Pizzas deletadas')
          Logger.info('Categories deletadas')

          for await (const client of profile.$relations.clients.rows) {
            await client.addresses().delete()
          }
          Logger.info('Addresses deletados')
          await profile.clients().delete()
          Logger.info('Clients deletados')
          for await (const bartender of profile.$relations.bartenders.rows) {
            await bartender.cashiers().delete()
          }
          await profile.cashiers().delete()
          Logger.info('Cashiers deletados')
          await profile.bartenders().delete()
          Logger.info('Bartenders deletados')
          await profile.cupons().delete()
          Logger.info('Cupons deletados')
          await profile.domains().delete()
          Logger.info('Domains deletados')
          // await profile.motoboys().delete()
          // Logger.info('Motoboys deletados')
          await profile.fees().delete()
          Logger.info('Fees deletadas')
        }
        await user.profiles().delete()
        Logger.info('Profiles deletada')
        await user.tokens().delete()
        await user.requests().delete()
        await user.bonusSupport().delete()
        await user.invoices().delete()
        await user.plans().detach()
        await user.delete()
      }
      Logger.info('Users deletada')

      return response.json({ ok: `Usuários com ids: ${usersIds.join()} deletados` })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = UserController
