'use strict'

const stripe = require('../../../../stripe')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/Auth')} Auth */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const User = use('App/Models/User')
const FlexPlan = use('App/Models/FlexPlan')
const Profile = use('App/Models/Profile')
const QueueController = use('App/Controllers/Http/QueueController')
const SystemProduct = use('App/Models/SystemProduct')
const Env = use('Env')
const Drive = use('Drive')
const { DateTime } = require('luxon')
class AdministratorController {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {Auth} ctx.auth
   */
  async releaseBlock({ auth, view, response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 22, metodo: 'releaseBlock' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      response.send(
        view.render('inner.adm.releaseBlock', {
          profile: profile ? profile.toJSON() : null,
        })
      )
    } catch (error) {
      throw error
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {Auth} ctx.auth
   */
  async postReleaseBlock({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 45, metodo: 'postReleaseBlock' })
      const { type, status, list } = request.all()
      const arrayList = list.split('\n')
      const result = {
        success: true,
        aprove: [],
        reject: [],
      }
      switch (type) {
        case 'slug':
          for (let itemSlug of arrayList) {
            const profile = await Profile.findBy('slug', itemSlug)
            if (profile) {
              profile.status = status
              await profile.save()
              result.aprove.push({ item: itemSlug })
            } else {
              result.reject.push({ item: itemSlug, message: 'Perfil não encontrado!' })
            }
          }

          break

        case 'email':
          for (let email of arrayList) {
            const user = await User.findBy('email', email)

            if (user) {
              const profile = await user.profile().fetch()

              if (profile) {
                profile.status = status
                await profile.save()
                result.aprove.push({ item: email })
              } else {
                result.reject.push({ item: email, message: `O usuário não possui perfil para ${status == 0 ? 'bloquear' : 'liberar'}!` })
              }
            } else {
              result.reject.push({ item: email, message: 'Usuário não encontrado!' })
            }
          }

          break

        case 'whatsapp':
          for (let whatsapp of arrayList) {
            const user = await User.findBy('whatsapp', whatsapp)

            if (user) {
              const profile = await user.profile().fetch()

              if (profile) {
                profile.status = status
                await profile.save()
                result.aprove.push({ item: whatsapp })
              } else {
                result.reject.push({ item: whatsapp, message: `O usuário não possui perfil para ${status == 0 ? 'bloquear' : 'liberar'}!` })
              }
            } else {
              result.reject.push({ item: whatsapp, message: 'Usuário não encontrado!' })
            }
          }

          break

        default:
          break
      }
      return response.json(result)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {Auth} ctx.auth
   */
  async userIndex({ response, view, auth }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 133, metodo: 'userIndex' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      return response.send(
        view.render('inner.adm.user.index', {
          profile: profile ? profile.toJSON() : null,
        })
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {Auth} ctx.auth
   */
  async getUser({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 159, metodo: 'getUser' })
      const { user, type } = request.all()
      const result = {
        success: true,
        user: undefined,
        profile: undefined,
      }

      switch (type) {
        case 'slug':
          const profile = await Profile.findBy('slug', user)
          result.profile = profile
          if (profile)
            result.user = await User.query()
              .where('id', profile.userId)
              .with('support')
              .with('seller')
              .with('plans', (query) => query.with('relateds'))
              .with('invoices', (invoice) => {
                invoice.with('requests').orderBy('id', 'desc').limit(4)
              })
              .first()
          break

        case 'email':
          result.user = await User.query()
            .where('email', user.replace('mailto:', ''))
            .with('support')
            .with('seller')
            .with('plans', (query) => query.with('relateds'))
            .with('invoices', (invoice) => {
              invoice.with('requests').orderBy('id', 'desc').limit(4)
            })
            .first()
          if (result.user) result.profile = await result.user.profile().fetch()
          break

        case 'name':
          result.user = await User.query()
            .where('name', 'like', `%${user.trim()}%`)
            .with('profile')
            .with('support')
            .with('seller')
            .with('plans')
            .with('invoices', (invoice) => {
              invoice.with('requests').orderBy('id', 'desc').limit(4)
            })
            .fetch()
          // if (result.user) result.profile = await result.user.profile().fetch()
          break

        case 'whatsapp':
          const whatsapp = user
            .replace(/[^\w\s]/gi, '')
            .split(' ')
            .join('')
          const whatsapp2 = `${whatsapp.substr(0, 2)} ${whatsapp.substr(2, 5)}-${whatsapp.substr(-4)}`
          const whatsapp3 = `(${whatsapp.substr(0, 2)}) ${whatsapp.substr(2, 5)}-${whatsapp.substr(-4)}`
          const whatsapp4 = `${whatsapp.substr(0, 2)} ${whatsapp.substr(2, 1)} ${whatsapp.substr(3, 4)}-${whatsapp.substr(-4)}`
          const whatsapp5 = `(${whatsapp.substr(0, 2)}) ${whatsapp.substr(2, 1)} ${whatsapp.substr(3, 4)}-${whatsapp.substr(-4)}`
          const whatsapp6 = `${whatsapp.substr(0, 2)} ${whatsapp.substr(2, 1)} ${whatsapp.substr(3, 3)}-${whatsapp.substr(-4)}`
          const whatsapp7 = `(${whatsapp.substr(0, 2)}) ${whatsapp.substr(2, 1)} ${whatsapp.substr(3, 3)}-${whatsapp.substr(-4)}`
          const whatsapp8 = `${whatsapp.substr(0, 2)} ${whatsapp.substr(2, 1)}${whatsapp.substr(3, 3)}-${whatsapp.substr(-4)}`
          const whatsapp9 = `(${whatsapp.substr(0, 2)}) ${whatsapp.substr(2, 1)}${whatsapp.substr(3, 3)}-${whatsapp.substr(-4)}`
          const whatsapp10 = `${whatsapp.substr(0, 2)}) ${whatsapp.substr(2, 1)}${whatsapp.substr(3, 3)}-${whatsapp.substr(-4)}`
          const whatsapp11 = `(${whatsapp.substr(0, 2)})${whatsapp.substr(2)}`

          const phonesFormat = {
            1: whatsapp,
            2: whatsapp2,
            3: whatsapp3,
            4: whatsapp4,
            5: whatsapp5,
            6: whatsapp6,
            7: whatsapp7,
            8: whatsapp8,
            9: whatsapp9,
            10: whatsapp10,
            11: whatsapp11,
          }

          for (const key of Object.keys(phonesFormat)) {
            result.user = await User.query()
              .where('whatsapp', phonesFormat[key])
              .with('support')
              .with('seller')
              .with('plans')
              .with('invoices', (invoice) => {
                invoice.with('requests').orderBy('id', 'desc').limit(4)
              })
              .first()

            if (result.user) {
              break
            }
          }

          if (result.user) result.profile = await result.user.profile().fetch()
          break

        default:
          break
      }

      if (!result.user) {
        result.success = false
        response.status(404)
      }

      const usersJSON = result.user && result.user.toJSON()

      // if (Array.isArray(usersJSON)) {
      //   for (const user of usersJSON) {
      //     const newUser = await User.find(user.id)
      //     const plans = await newUser.plans().fetch()
      //     user.plans = plans.toJSON()
      //   }
      // } else {
      //   const newUser = usersJSON && await User.find(usersJSON.id)
      //   const plans = await newUser.plans().fetch()
      //   usersJSON.plans = plans.toJSON()
      // }

      result.user = usersJSON
      console.log(result.user)
      return response.json(result)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {Auth} ctx.auth
   */
  async updateUser({ request, response, auth }) {
    try {
      const admUser = await auth.getUser()
      console.log('Starting: ', { controller: 'AdministratorController', linha: 272, metodo: 'updateUser' })
      const data = request.except(['_csrf', '_method'])
      const user = await User.find(data.id)
      user.name = data.name
      user.email = data.email
      user.secretNumber = data.secretNumber
      user.whatsapp = data.whatsapp
      user.due = data.due
      user.controls.disableInvoice = data.disableInvoice
      user.controls.obs = data.obs
      user.controls.beta = data.beta

      if (user.controls.print && data.print) {
        user.controls.print.web = data.print.web
      } else if (data.print) {
        if (user.controls.print) {
          user.controls.print.web = data.print.web
        } else {
          user.controls.print = { web: data.print.web }
        }
      }

      const plans = await user.plans().fetch()

      if (data.password) {
        user.password = data.password
        user.controls.attempts = 0
      }
      if (admUser.controls.type === 'adm' || admUser.controls.type === 'manager') {
        user.controls.canceled = data.canceled
      }

      await user.save()
      const newUser = await User.query().where('id', user.id).with('profile').with('seller').with('support').first()
      return response.json({
        success: true,
        user: newUser,
        plans: plans.toJSON(),
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async deleteAddresses({ response, request }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 345, metodo: 'deletedAddresses' })
      const data = request.except(['_csrf', '_method'])
      const profile = await Profile.find(data.profileId)
      const clients = await profile.clients().fetch()

      for (const client of clients.rows) {
        const addresses = await client.addresses().fetch()
        for (const address of addresses.rows) {
          address.deleted_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
          await address.save()
        }
      }
      return response.status(200).send({ message: 'Deleted_at added to client addresses successfully' })
    } catch (error) {
      console.error(error)
      return response.status(500).send({ error: 'Internal Server Error' })
    }
  }

  async updateProfile({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 319, metodo: 'updateProfile' })
      const data = request.except(['_csrf', '_method'])
      const profile = await Profile.find(data.id)
      const user = await profile.user().fetch()
      profile.name = data.name
      profile.status = data.status
      profile.showTotal = data.showTotal
      profile.options.delivery.enableKm = data.km
      profile.whatsapp = data.whatsapp
      profile.options.twoSend = data.twoSend
      profile.options.onlinePix = data.onlinePix
      profile.options.onlineCard = data.onlineCard
      profile.options.inventoryControl = data.inventoryControl
      profile.options.legacyPix = data.legacyPix
      profile.options.locale = data.locale
      const alreadyExistisSlug = await Profile.query().where('slug', data.slug).whereNot('id', profile.id).first()
      if (alreadyExistisSlug) {
        throw new Error('Já existe um cliente com o slug enviado')
      }
      profile.slug = data.slug

      if (profile.status && user.controls.canceled) {
        user.controls.canceled = false
        await user.save()
      }

      await profile.save()
      return response.json({
        success: true,
        profile: profile,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async unlinkAsaas({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', metodo: 'unlinkAsaas' })
      const data = request.except(['_csrf', '_method'])
      // const profile = await Profile.find(data.id)
      const profile = await Profile.find(data.id)

      profile.options._asaas = profile.options.asaas
      delete profile.options.asaas
      profile.options.legacyPix = true
      profile.options.onlinePix = false
      profile.options.onlineCard = false

      await profile.save()
      return response.json({
        options: profile.options,
      })
    } catch (error) {
      console.error({
        error: error,
      })
    }
  }

  async setUserSupport({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 348, metodo: 'setUserSupport' })
      const { user } = request.all()
      const client = await User.find(user)

      let newUser = null

      if (!client.supportId) {
        newUser = await QueueController.setClientSupport(user)
      }

      return response.json(newUser)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUsers({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 368, metodo: 'getUsers' })
      const users = await User.query()
        .whereRaw('controls->"$.type" is null')
        .with('profile')
        .with('seller')
        .with('support')
        .with('plans', (query) => query.with('relateds'))
        .with('invoices.requests', (invoice) => {
          invoice.orderBy('id', 'desc').limit(4)
        })
        .orderBy('id', 'desc')
        .paginate(params.page, 30)

      const plans = await FlexPlan.query().with('relateds').fetch()

      const usersJSON = users.toJSON()

      return response.json({ users: usersJSON, plans })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUsersBySupport({ params, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 344, metodo: 'getUsersBySupport' })
      const user = await auth.getUser()

      const users = await User.query()
        .where('supportId', user.id)
        .with('profile')
        .with('seller')
        .with('support')
        .orderBy('id', 'desc')
        .paginate(params.page, 30)
      return response.json(users)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pageSupportUsers({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 358, metodo: 'pageSupportUsers' })
      response.send(
        view.render('inner.adm.reports.supportUsers', {
          profile: null,
        })
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getClientsCard({ response }) {
    console.log('Starting: ', { controller: 'AdministratorController', linha: 371, metodo: 'getClientsCard' })
    try {
      const clients = await User.query()
        .whereRaw('controls->"$.type" is null and controls->"$.disableInvoice" = true')
        .with('profile')
        .with('support')
        .with('seller')
        .orderBy('id', 'desc')
        .fetch()

      const clis = clients.toJSON()

      return response.json(clis.filter((c) => c.profile && c.profile.status == 1))
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pageClientsCard({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 393, metodo: 'pageClientsCard' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      // return response.send("<h1>teste</h1>")

      return response.send(
        view.render('inner.adm.user.clientsCard', {
          profile: profile,
        })
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getFlexPlans({ response }) {
    try {
      console.log('Starting: ', { controller: 'AdministratorController', linha: 412, metodo: 'getFlexPlans' })
      const plans = await FlexPlan.all()
      return response.json(plans)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async productCreate({ request, response }) {
    console.log('Starting: ', { controller: 'AdministratorController', linha: 604, metodo: 'stripeProductCreate' })

    try {
      const data = request.except(['_csrf'])
      const systemProduct = await AdministratorController.systemProductCreate(data)

      return response.json({
        systemProduct,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async productUpdate({ request, response }) {
    console.log('Starting: ', { controller: 'AdministratorController', linha: 672, metodo: 'stripeProductUpdate' })
    // let stripeProduct;
    try {
      const data = request.except(['_csrf'])
      const systemProduct = await SystemProduct.find(data.product.id)

      if (systemProduct) {
        if (systemProduct.operations.gateways) {
          for (const [gateway, value] of Object.entries(systemProduct.operations.gateways)) {
            // if (gateway === 'stripe') {
            //   stripeProduct = await stripe.products.update(value.id, {
            //     name: data.product.name,
            //     description: data.product.description ? data.product.description : undefined,
            //     active: !!data.product.status
            //   });
            // }
          }
        }

        // systemProduct.name = stripeProduct.name;
        // systemProduct.description = stripeProduct.description;
        // systemProduct.status = data.product.status;

        for (const price of data.product.operations.prices) {
          if (!systemProduct.operations.prices.some((pr) => pr.id === price.id)) {
            // const priceToStripe = await AdministratorController.priceCreateFormat(stripeProduct.id, price, stripeProduct.metadata);
            // const priceStripe = await stripe.prices.create(priceToStripe);
            price.gateways = {
              ...price.gateways,
              // stripe: {
              //   id: priceStripe.id,
              //   status: priceStripe.active ? 1 : 0
              // }
            }
          }
        }
        systemProduct.default_price = data.product.default_price
        systemProduct.operations.prices = data.product.operations.prices

        await systemProduct.save()

        return response.json({
          systemProduct,
        })
      }

      throw {
        status: 404,
        message: 'Produto não encontrado',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async productToggleStatus({ request, response, params }) {
    console.log('Starting: ', { controller: 'AdministratorController', linha: 547, metodo: 'productToggleStatus' })
    // let stripeProduct;
    try {
      const systemProduct = await SystemProduct.find(params.id)

      if (systemProduct) {
        systemProduct.status = !systemProduct.status

        await systemProduct.save()

        return response.json({
          systemProduct,
        })
      }

      throw {
        status: 404,
        message: 'Produto não encontrado',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async productTogglePriceStatus({ response, params }) {
    console.log('Starting: ', { controller: 'AdministratorController', linha: 574, metodo: 'productTogglePriceStatus' })
    // let stripeProduct;
    try {
      const systemProduct = await SystemProduct.find(params.id)

      if (systemProduct) {
        systemProduct.operations.prices.forEach((pr) => {
          if (pr.id === params.priceId) {
            pr.status = !pr.status
          }
        })

        await systemProduct.save()

        return response.json({
          systemProduct,
        })
      }

      throw {
        status: 404,
        message: 'Produto não encontrado',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async productDelete({ response, params }) {
    try {
      const systemProduct = await SystemProduct.findOrFail(params.id).catch(() => {
        response.status(404).json({
          message: 'Produto não encontrado para este id ' + params.id,
        })
      })

      if (systemProduct && systemProduct.operations.gateways) {
        for (const [gateway, value] of Object.entries(systemProduct.operations.gateways)) {
          if (gateway === 'stripe') {
            await stripe.products.update(value.id, {
              active: false,
            })
          }
        }
        systemProduct.status = 0
        await systemProduct.save()
        return response.status(204).end()
      } else {
        throw {
          status: 404,
          message: 'Produto não encontrado',
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getListRegisters({ params, response }) {
    try {
      const file = await Drive.disk('s3').get(`site/registers/${params.year}-${params.month}.json`)
      return response.json(JSON.parse(file))
    } catch (error) {
      console.error(error)
      return response.status(404).json({ message: 'Lista não encontrada!' })
    }
  }

  async updateLead({ params, request, response }) {
    try {
      const { sellerId } = request.all()
      const file = await Drive.disk('s3').get(`site/registers/${params.year}-${params.month}.json`)
      const fileParsed = JSON.parse(file)
      const seller = await User.query().where({ id: sellerId }).setVisible(['id', 'name']).first()
      fileParsed[params.id].contacted_at = DateTime.local().toISO()
      fileParsed[params.id].seller = seller.toJSON()
      await Drive.disk('s3').put(`site/registers/${params.year}-${params.month}.json`, JSON.stringify(fileParsed))
      return response.json({ message: 'Alterado com sucesso!', lead: fileParsed[params.id] })
    } catch (error) {
      console.error(error)
      return response.status(404).json({ message: 'Lista não encontrada!', error })
    }
  }

  static async priceCreateFormat(idProductStripe, priceItem, metadata, recurring) {
    return new Promise((resolve, reject) => {
      try {
        const default_currency = priceItem.default_currency
        const priceToStripe = {
          nickname: `Price of ${metadata.name}`,
          currency: default_currency,
          active: true,
          unit_amount: priceItem.currencies[default_currency].unit_amount,
          product: idProductStripe,
          metadata,
          recurring,
          currency_options: {},
        }

        for (const [currency, value] of Object.entries(priceItem.currencies)) {
          if (currency !== priceItem.default_currency) {
            priceToStripe.currency_options[currency] = {
              unit_amount: value.unit_amount,
            }
          }
        }

        resolve(priceToStripe)
      } catch (error) {
        console.error(error)
        throw error
      }
    })
  }

  static async systemProductCreate(data) {
    try {
      let systemProduct
      // let stripeProductId;
      let metadata = {}
      let plan
      let originalValue = data.product.operations.value

      switch (data.product.service) {
        case 'printer':
          originalValue = Env.get('SALE_PRINT_VALUE')
          break
        case 'menu':
          originalValue = Env.get('SERVICE_START_VALUE')
          break
      }

      try {
        if (data.plan) {
          plan = await FlexPlan.find(data.plan.id)
          if (plan) {
            metadata.plan_id = plan.id
          }
        }
        // const product  = await SystemProduct.find(data.metadata.id);

        // const stripeProduct = await stripe.products.create({
        //   name: data.product.name,
        //   description: data.product.description ? data.product.description : undefined,
        //   active: !!data.product.status
        // });

        // stripeProductId = stripeProduct.id;
        const product = {
          name: data.product.name,
          description: data.product.description,
          status: data.product.status,
          service: data.product.service,
          default_price: data.product.default_price,
          operations: {
            value: originalValue,
            // gateways: {
            //   stripe: {
            //     id: stripeProduct.id,
            //     status: data.product.status
            //   }
            // }
          },
        }

        if (plan) {
          product.plan_id = plan.id
          product.operations.type = data.period
          product.service = 'plan'
          metadata.category = plan.category
          metadata.period = data.period
        }

        systemProduct = await SystemProduct.create(product)

        metadata.id = systemProduct.id
        metadata.name = systemProduct.name
        metadata.service = systemProduct.service

        for (const price of data.product.operations.prices) {
          metadata.priceId = price.id

          // const priceToStripe = await AdministratorController.priceCreateFormat(stripeProduct.id, price, metadata, data.recurring);
          // const priceStripe = await stripe.prices.create(priceToStripe);

          price.gateways = {
            // stripe: {
            //   id: priceStripe.id,
            //   status: priceStripe.active ? 1 : 0
            // }
          }
        }

        systemProduct.default_price = data.product.default_price
        systemProduct.operations.prices = data.product.operations.prices

        await systemProduct.save()
        // await stripe.products.update(stripeProduct.id, {
        //   metadata
        // });

        return systemProduct
      } catch (error) {
        console.error(error)

        if (systemProduct) {
          await systemProduct.delete()
        }

        // if (stripeProductId) {
        //   await stripe.products.update(stripeProductId, {
        //     active: false,
        //   });
        // }

        throw error
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = AdministratorController
