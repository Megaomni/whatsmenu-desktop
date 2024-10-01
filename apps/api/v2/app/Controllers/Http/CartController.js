'use strict'

const { DateTime } = require('luxon')
const axios = require('axios')
const moment = use('moment')

const Database = use('Database')
const Ws = use('Ws')
const Env = use('Env')
const ApiController = use('App/Controllers/Http/ApiController')

const InventoryProvider = use('InventoryProvider')

const Profile = use('App/Models/Profile')
const UserR = use('App/Models/ReadOnly/User')
const ProfileR = use('App/Models/ReadOnly/Profile')
const Client = use('App/Models/Client')
const ClientR = use('App/Models/ReadOnly/Client')
const ClientAddress = use('App/Models/ClientAddress')

const Cart = use('App/Models/Cart')
const CartR = use('App/Models/ReadOnly/Cart')
const CartIten = use('App/Models/CartIten')
const Command = use('App/Models/Command')
const Cashier = use('App/Models/Cashier')
const Cupom = use('App/Models/Cupom')
const Bartender = use('App/Models/Bartender')
const Category = use('App/Models/Category')
const PizzaProduct = use('App/Models/PizzaProduct')
const Product = use('App/Models/Product')
class CartController {
  async carts({ auth, request, response }) {
    try {
      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()

      let fuso = { hour: '-03:00', zone: 'UTC-3' }
      switch (profile.timeZone) {
        case 'America/Rio_Branco':
          fuso = { hour: '-05:00', zone: 'UTC-5' }
          break
        case 'America/Manaus':
          fuso = { hour: '-04:00', zone: 'UTC-4' }
          break
        case 'America/Noronha':
          fuso = { hour: '-02:00', zone: 'UTC-2' }
          break
      }

      const hourFuso = DateTime.local()
        .setZone(fuso.zone)
        .minus({ day: DateTime.local().ts > DateTime.fromObject({ hour: 4, minute: 0 }).setZone(fuso.zone).ts ? 0 : 1 })
        .toFormat('yyyy-MM-dd')
      const addDayInFuso = DateTime.local().plus({ day: 1 }).toFormat('yyyy-MM-dd')

      const carts = await profile
        .carts()
        .whereNot('type', 'P')
        .whereRaw(`(CONVERT_TZ(created_at,'-03:00','${fuso.hour}') BETWEEN '${hourFuso}' and '${addDayInFuso}')`)
        .orderBy('id', 'desc')
        .with('itens')
        .with('address')
        .with('client', (qClient) => {
          qClient.setHidden(['last_requests'])
        })
        .with('cupom')
        .with('command.opened.table') //, (openedQuery) => openedQuery.with('commands.carts').with('table')))
        .with('bartender')
        // .whereNotIn('statusPayment', ['pending', 'cancelled'])
        .with('cashier', (qCashier) => {
          qCashier.setHidden(['transactions', 'closedValues_system'])
        })
        .fetch()

      return response.json({ carts })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async cartsPaginate({ auth, request, response, params }) {
    try {
      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()

      let fuso = { hour: '-03:00', zone: 'UTC-3' }
      switch (profile.timeZone) {
        case 'America/Rio_Branco':
          fuso = { hour: '-05:00', zone: 'UTC-5' }
          break
        case 'America/Manaus':
          fuso = { hour: '-04:00', zone: 'UTC-4' }
          break
        case 'America/Noronha':
          fuso = { hour: '-02:00', zone: 'UTC-2' }
          break
      }

      const hourFuso = DateTime.local()
        .setZone(fuso.zone)
        .minus({ day: DateTime.local().ts > DateTime.fromObject({ hour: 4, minute: 0 }).setZone(fuso.zone).ts ? 0 : 1 })
        .toFormat('yyyy-MM-dd')
      const addDayInFuso = DateTime.local().plus({ day: 1 }).toFormat('yyyy-MM-dd')

      const carts = await profile
        .carts()
        .setHidden(['profileId', 'clientId', 'addressId', 'cupomId', 'commandId', 'bartenderId', 'cashierId', 'motoboyId'])
        .whereNot('type', 'P')
        .whereRaw(`(CONVERT_TZ(created_at,'-03:00','${fuso.hour}') BETWEEN '${hourFuso}' and '${addDayInFuso}')`)
        .orderBy('id', 'desc')
        .with('itens')
        .with('address')
        .with('client', (qClient) => {
          qClient.setHidden(['last_requests'])
        })
        .with('cupom')
        .with('command.opened.table') //, (openedQuery) => openedQuery.with('commands.carts').with('table')))
        .with('bartender')
        .with('cashier', (qCashier) => {
          qCashier.setHidden(['transactions', 'closedValues_system'])
        })
        .paginate(params.page, request.qs.liimit ? request.qs.liimit : 10)

      return response.json({ carts })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async list({ params, response }) {
    try {
      const { slug, clientId } = params
      const profile = await ProfileR.findBy('slug', slug)
      const client = await ClientR.query().where('id', clientId).where('profileId', profile.id).first()
      const carts = await CartR.query().where('clientId', client.id).with('itens').fetch()

      return response.json(carts)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async bestSellers({ auth, request, response, params }) {
    try {
      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()
      const { startDate, endDate } = request.all()
      const { page } = params

      const results = await Database.connection('mysql_r')
        .table('cart_itens')
        .select('name', 'pizzaId', 'productId', 'profileId', Database.raw('SUM(CAST(details->"$.value" AS DECIMAL(10,2)) * quantity) as value'))
        .sum('quantity as quantity')
        .innerJoin('carts', 'cart_itens.cartId', 'carts.id')
        .where('profileId', profile.id)
        .where((whereBuilder) => {
          whereBuilder
            .andWhere((nestedBuilder) => {
              nestedBuilder.whereNot('status', 'canceled')
            })
            .orWhere((nestedBuilder) => {
              nestedBuilder.whereNull('status')
            })
        })
        .where((whereBuilder) => {
          whereBuilder.where('statusPayment', 'offline').orWhere('statusPayment', 'paid')
        })
        .whereBetween('carts.created_at', [startDate, endDate])
        .groupBy('name', 'pizzaId', 'productId', 'profileId', Database.raw('CAST(details->"$.value" AS DECIMAL(10,2))'))
        .orderBy('quantity', 'desc')
        .paginate(page, 50)

      return response.json({ results })
    } catch (error) {
      console.error(error)
      return response.status(500).send({ error: 'Error ao buscar o relatório' })
    }
  }

  async getCart({ params, response }) {
    try {
      const profile = params.profile

      if (profile) {
        const cart = await CartR.query()
          .where('code', params.code)
          .where('profileId', profile.id)
          .with('cupom')
          .with('itens')
          .with('address')
          .with('motoboy')
          .with('client')
          .first()

        return response.json({ cart })
      }

      throw {
        status: 404,
        message: 'Loja não encontrada',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  static async generateVouchers(cart, response, profile) {
    try {
      if (!profile) {
        profile = await cart.profile().fetch()
      }

      if (!profile.status) {
        if (response) {
          return response.status(401).json({
            code: '401',
            message: 'Desculpe-nos o transtorno, mas esta loja no momento se encontra fechada.',
          })
        }
        throw {
          status: 401,
          message: 'Desculpe-nos o transtorno, mas esta loja no momento se encontra fechada.',
        }
      }

      if (!profile.options.voucher[0].status) {
        return
      }

      let voucher

      const cartTotal = CartController.getTotalcartValue(cart) - cart.taxDelivery
      const cashbackEqualOrGreaterCart = cart.formsPayment.some((form) => form.payment === 'cashback' && parseFloat(form.value) >= cartTotal)

      if (cashbackEqualOrGreaterCart) {
        cart.formsPayment = cart.formsPayment.filter((form) => form.payment === 'cashback')
        const usedCashback = cart.formsPayment.find((form) => form.payment === 'cashback')
        const remainingCashback = usedCashback.value - cartTotal

        if (remainingCashback > 0) {
          try {
            const { data } = await axios.post(`${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/vouchers/create`, {
              profileId: profile.id,
              clientId: cart.clientId,
              value: parseFloat(remainingCashback.toFixed(2)),
              expirationDays: profile.options.voucher[0].expirationDays,
            })
            voucher = data.voucher
          } catch (error) {
            console.error('Erro ao criar o voucher:', error)
          }
        }
      }

      const usedCashback = cart.formsPayment.find((form) => form.payment === 'cashback')
      if (usedCashback) {
        const anotherPayment = cart.formsPayment.find((form) => form.payment !== 'cashback')
        if (anotherPayment) {
          anotherPayment.value -= usedCashback.value
        }
        try {
          const { data } = await axios.post(`${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/vouchers/create`, {
            profileId: profile.id,
            clientId: cart.clientId,
            value: parseFloat((usedCashback.value * -1).toFixed(2)),
            status: 'used',
          })
          usedCashback.voucherId = data.voucher.id
          try {
            const updateResponse = await axios.patch(
              `${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/clients/${cart.clientId}/updateVouchers`,
              {
                vouchers: [
                  {
                    id: usedCashback.voucherId,
                    status: 'used',
                  },
                ],
              }
            )
          } catch (error) {
            console.error('Erro ao atualizar os vouchers:', error)
          }
        } catch (error) {
          console.error(error)
        }
      }

      let totalPaidWithCashback = 0
      for (const payment of cart.formsPayment) {
        if (payment.payment === 'cashback') {
          totalPaidWithCashback += parseFloat(payment.value)
        }
      }

      const remainingAfterCashback = cartTotal - totalPaidWithCashback
      if (remainingAfterCashback > 0) {
        const percentageForNewVoucher = profile.options.voucher[0].percentage
        const valueForNewVoucher = (remainingAfterCashback * percentageForNewVoucher) / 100

        try {
          const { data } = await axios.post(`${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/vouchers/create`, {
            profileId: profile.id,
            clientId: cart.clientId,
            value: Math.max(parseFloat(valueForNewVoucher.toFixed(2)), 0.01),
            expirationDays: profile.options.voucher[0].expirationDays,
          })

          voucher = data.voucher
        } catch (error) {
          console.error('Erro ao criar o voucher:', error)
        }
      }

      const remainingCashback = totalPaidWithCashback - cartTotal
      if (remainingCashback > 0) {
        try {
          const { data } = await axios.post(`${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/vouchers/create`, {
            profileId: profile.id,
            clientId: cart.clientId,
            value: parseFloat(remainingCashback.toFixed(2)),
            expirationDays: profile.options.voucher[0].expirationDays,
          })
        } catch (error) {
          console.error('Erro ao criar o voucher:', error)
        }
      }

      if (voucher) {
        cart.voucherId = voucher.id
        await cart.save()
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async store({ params, request, response }) {
    const { slug } = params
    try {
      const data = request.except(['_csrf', '_method'])
      const profile = await Profile.findBy('slug', slug)
      if (!profile.status) {
        return response.status(401).json({
          code: '401',
          message: 'Desculpe nos o transtorno, mas esta loja no momento se encontra fechada.',
        })
      }

      let client
      if (data.clientId) {
        client = await Client.query().where('id', data.clientId).where('profileId', profile.id).first()
        // if (!client.controls.whatsapp) {
        //   try {
        //     const { data } = await axios.post(`${Env.get('BOT_IP')}/whatsapp/checkNumberId`, {
        //       contact: `55${client.whatsapp}`,
        //     })
        //     client.controls.whatsapp = data
        //     await client.save()
        //   } catch (error) {
        //     console.error(error)
        //   }
        // }
      }
      const user = await profile.user().fetch()
      const plans = (await user.plans().fetch()).toJSON()

      if (data.type === 'D') {
        const haveDelivery = plans.some((plan) => plan.category === 'basic')
        if (!haveDelivery || (profile.options.delivery.disableDelivery && data.addressId)) {
          return response.status(401).json({ message: 'A Loja não aceita pedidos para entrega' })
        }

        if (!haveDelivery || (!profile.deliveryLocal && !data.addressId && data.type != 'T')) {
          return response.status(401).json({ message: 'A Loja não aceita pedidos para retirada' })
        }
      } else if (data.type === 'P') {
        const havePackage = plans.some((plan) => plan.category === 'package')
        if (!havePackage) {
          return response
            .status(401)
            .json({ message: `A Loja não aceita pedidos para ${profile.options.package.label2 ? 'Agendamentos' : 'Encomendas'}` })
        }
        if (!profile.options.package.shippingDelivery.active && data.addressId) {
          return response.status(401).json({ message: 'A Loja não aceita pedidos para entrega' })
        }

        if (!profile.options.package.shippingLocal.active && !data.addressId && data.type != 'T') {
          return response.status(401).json({ message: 'A Loja não aceita pedidos para retirada' })
        }
      }

      const address = await ClientAddress.find(data.addressId)

      const isPackageDeliveryDate =
        data.type === 'P' &&
        profile.options.package.cashierDate === 'deliveryDate' &&
        data.packageDate &&
        DateTime.fromFormat(data.packageDate, 'yyyy-MM-dd HH:mm:ss')
          .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          .diff(DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }), ['days'])
          .toObject().days > 0

      if (isPackageDeliveryDate) {
        data.cashierId = null
      }

      let cashier

      if (data.cashierId) {
        cashier = await Cashier.query().where({ closed_at: null, id: data.cashierId, profileId: profile.id }).first()
      } else {
        const openedCashiers = await Cashier.query().where({ closed_at: null, profileId: profile.id }).fetch()

        cashier = openedCashiers.rows.find((c) => DateTime.fromSQL(c.toJSON().created_at).diffNow('hours').values.hours > -24)

        if (!cashier && !isPackageDeliveryDate) {
          const bartender = await Bartender.query()
            .where({ profileId: profile.id })
            .whereRaw(`JSON_CONTAINS(controls, '{ "defaultCashier": true }')`)
            .with('activeCashier')
            .first()
          if (bartender) {
            if (bartender.toJSON().activeCashier) {
              cashier = bartender.toJSON().activeCashier
            } else {
              cashier = await Cashier.create({
                profileId: profile.id,
                bartenderId: bartender.id,
                initialValue: 0,
                closed_at: null,
              })
            }
          }
        }
      }

      let newCart = null
      let printTopic = null
      let clientCart = await Cart.query()
        .where({
          profileId: profile.id,
          code: profile.request + 1,
        })
        .first()

      let command
      let tableOpened
      let table

      if (profile.options.inventoryControl) {
        const complementVerification = await InventoryProvider.verifyCartComplementsAvailability(data)
        if (complementVerification.code) {
          return response.status(400).json(complementVerification)
        }

        for (const item of data.itens) {
          const availability = await InventoryProvider.verifyProductDisponibility(item, data.itens)
          if (availability.code) return response.status(400).json(availability)
        }

        for (const item of data.itens.filter((item) => item.type === 'pizza')) {
          const availability = await InventoryProvider.verifyPizzaFlavorsAvailability(item)
          if (availability.code) return response.status(400).json(availability)
        }

        for (const item of data.itens) {
          await InventoryProvider.updateProductDisponibility(item)
        }

        for (const item of data.itens.filter((item) => item.type === 'pizza')) {
          await InventoryProvider.updatePizzaFlavors(item)
        }

        await InventoryProvider.updateComplementAvailability(complementVerification)
      }

      if (data.type === 'T') {
        data.addressId = null
        const haveTable = plans.some((plan) => plan.category === 'table')
        if (!haveTable) {
          return response.status(401).json({ message: 'A Loja não aceita pedidos para mesas' })
        }

        command = data.type === 'T' ? await Command.find(data.commandId) : undefined
        if (!command) {
          return response.status(404).json({ message: 'Comanda não encontrada' })
        }
        tableOpened = command ? await command.opened().fetch() : undefined
        table = tableOpened ? await tableOpened.table().fetch() : undefined
        if (!table.status || !command.status) {
          response.status(405)
          return response.json({
            success: false,
            code: '405-3',
            message: !command.status ? 'Comanda Encerrada!' : 'Mesa pausada!',
            tableIsPaused: true,
          })
        }
      }

      await Database.transaction(async (trx) => {
        profile.request++
        data.code = profile.request
        await profile.save(trx)

        printTopic = Ws.getChannel('print:*').topic(`print:${slug}`)

        if (!clientCart) {
          let tx = { value: 0, time: 0 }
          if (profile.typeDelivery === 'km' && address) {
            const km = profile.taxDelivery.find((tax) => (tax.distance > 1000 ? tax.distance : tax.distance * 1000) >= address.distance)

            if (km) {
              tx = km
            }
          } else if (profile.typeDelivery === 'neighborhood' && address) {
            const ct = profile.taxDelivery.find((t) => this.normalizeString(t.city) === this.normalizeString(address.city))
            if (ct) {
              tx = ct.neighborhoods.find((n) => this.normalizeString(n.name) === this.normalizeString(address.neighborhood))
            }
          }

          if (!tx) {
            console.error('Endereço fora da área de cobertura', address.toJSON())
            throw response.status(422).json({ message: 'Endereço fora da área de cobertura' })
          }

          if (data.cupomId) {
            const cupom = await Cupom.find(data.cupomId)

            if (cupom && cupom.type === 'freight') {
              tx.value = 0
            }
          }

          if (profile.options.package.active && data.packageDate) {
            let requestsP
            let requests = []
            let page = 1
            const packageDateFormat = DateTime.fromJSDate(new Date(data.packageDate))
            const maxProfilePackage = Number(profile.options.package.maxPackage)
            const maxProfilePackageHour = Number(profile.options.package.maxPackageHour)

            do {
              requestsP = await profile
                .carts()
                .where('type', 'P')
                .whereBetween('packageDate', [packageDateFormat.toFormat('yyyy-MM-dd 00:00:00'), packageDateFormat.toFormat('yyyy-MM-dd 23:59:59')])
                .whereNull('status', (query) => query.orWhere('status', '!=', 'canceled'))
                .orderBy('packageDate')
                .paginate(page, 30)

              requests.push(...requestsP.rows)
              page++
            } while (page <= requestsP.pages.lastPage)

            const quantityRequestsPackage = requests.filter(
              (req) => DateTime.fromJSDate(new Date(req.packageDate)).toFormat('yyyy-MM-dd HH:mm:ss') === data.packageDate
            ).length

            if (requests.length >= maxProfilePackage) {
              throw {
                status: 409,
                success: false,
                code: '409',
                date: DateTime.fromJSDate(new Date(data.packageDate)).toISO(),
                message: 'A data escolhida não esta mais disponivel.\n Por favor selecione uma outra data',
                dates: [DateTime.fromJSDate(new Date(data.packageDate)).toISO()],
              }
            }

            if (quantityRequestsPackage >= maxProfilePackageHour) {
              const choiceHour = DateTime.fromJSDate(new Date(data.packageDate + ' '))
              throw {
                status: 418,
                success: false,
                code: 418,
                message: 'Horário indisponível, ' + choiceHour.toFormat('HH:mm:') + '<br>Favor Escolher outro horário.',
                hour: choiceHour.toFormat('HH:mm'),
                date: DateTime.fromJSDate(new Date(data.packageDate)).toISO(),
              }
            }
          }

          newCart = {
            profileId: profile.id,
            status: null,
            statusPayment: data.paymentType === 'online' ? 'pending' : 'offline',
            cupomId: data.cupomId || null,
            commandId: data.commandId || null,
            bartenderId: data.bartenderId || null,
            cashierId: cashier && !isPackageDeliveryDate ? cashier.id : null,
            obs: data.obs,
            code: profile.request,
            clientId: client ? client.id : null,
            addressId: address ? address.id : null,
            formsPayment: data.formsPayment,
            taxDelivery: tx.value ? tx.value : data.taxDeliveryValue === null ? null : 0,
            timeDelivery: tx.time ? tx.time : 0,
            total: data.total,
            type: data.type,
            packageDate: data.packageDate || null,
            secretNumber: data.secretNumber,
            motoboyId: data.motoboyId || null,
            controls: {
              userAgent: data.userAgent,
              whatsApp: {
                alreadySent: false,
              },
            },
          }

          if (!data.bartenderId) {
            delete newCart.bartenderId
          }

          if (newCart.taxDelivery === 'A consultar') {
            newCart.taxDelivery = null
          }

          clientCart = await Cart.create(newCart, trx)
          const itens_cart = []
          const itens_cartPizza = []

          for (const item of data.itens) {
            if (item.type === 'default') {
              itens_cart.push(item)
            }
            if (item.type === 'pizza') {
              itens_cartPizza.push(item)
            }
            await CartIten.create(
              {
                cartId: clientCart.id,
                ...item,
              },
              trx
            )
          }

          if (client) {
            if (!client.last_requests) {
              client.last_requests = []
            }
            if (client.last_requests.length === 10) {
              client.last_requests.pop()
            }

            const { formsPayment, ...newCartRest } = clientCart.toJSON()

            client.last_requests.unshift({ ...newCartRest, cart: itens_cart, cartPizza: itens_cartPizza })
            client.date_last_request = clientCart.created_at

            if (!client.controls) {
              client.controls = {}
            }

            if (!client.controls.requests) {
              client.controls.requests = {}
            }
            client.controls.requests.quantity++
            client.controls.requests.total += clientCart.total
            client.controls.requests.total = Number(client.controls.requests.total.toFixed(2))

            await client.save(trx)
          }
        }
      })
        .then(async () => {
          try {
            const cart = await Cart.query()
              .where('id', clientCart.id)
              .with('itens')
              .with('cupom')
              .with('address')
              .with('command', (commandQuery) => commandQuery.with('opened', (openedQuery) => openedQuery.with('commands.carts').with('table')))
              .with('bartender')
              .with('cashier')
              .with('client', (clientQuery) => clientQuery.setVisible(['name', 'whatsapp', 'controls']))
              .first()

            let cupomValue = 0
            if (cart.cupom) {
              switch (cart.cupom.type) {
                case 'percent':
                  cupomValue = cart.total * (Number(cart.cupom.value) / 100)
                  break
                case 'value':
                  cupomValue = Number(cart.cupom.value)
                  break
                case 'freight':
                  cupomValue = cart.taxDelivery
              }
            }

            if (cart.type !== 'T' && cart.statusPayment === 'offline') {
              await CartController.generateVouchers(cart, response, profile)
            }

            const requestTopic = Ws.getChannel('request:*').topic(`request:${slug}`)

            if (cart) {
              cart.packageDate = DateTime.fromJSDate(new Date(cart.packageDate)).toSQL()
            }

            if (requestTopic && cart && cart.statusPayment !== 'pending' && cart.statusPayment !== 'cancelled') {
              ; (async () => {
                requestTopic.broadcast(`request:${slug}`, [{ ...cart.toJSON() }])
                requestTopic.broadcast(`menu:${slug}`, { menu: 'update' })
              })()

              console.log({
                code: data.code,
                status: cart.status,
                slug: slug,
                total: data.total,
              })
            } else {
              console.log({
                topic: requestTopic,
                slug: slug,
                code: data.code,
                date: moment().format(),
              })
            }

            if (clientCart.type !== 'P') {
              const command = cart.type === 'T' ? await Command.find(newCart.commandId) : undefined
              const tableOpened = command ? await command.opened().fetch() : undefined
              const table = tableOpened ? await tableOpened.table().fetch() : undefined
              const commandJSON = command ? command.toJSON() : null
              const req = cart.toJSON()

              if (commandJSON) {
                commandJSON.carts = [req]
                commandJSON.subTotal = this.getTotalValue(commandJSON, 'command')
                commandJSON.totalValue = this.getTotalValue(commandJSON, 'commandFee')
                commandJSON.lack = this.getTotalValue(commandJSON, 'lack')
                commandJSON.paid = this.getTotalValue(commandJSON, 'paid')
                commandJSON.fees = commandJSON.fees.filter((fee) => fee.deleted_at === null)
              }

              let printLayoutResult
              if (printTopic && cart && cart.statusPayment !== 'pending' && cart.statusPayment !== 'cancelled') {
                try {
                  const { data: result } = await axios.post('https://next.whatsmenu.com.br/api/printLayout', {
                    cart: req,
                    table,
                    profile,
                  })
                  printLayoutResult = result
                } catch (error) {
                  console.error(error)
                }

                if (printLayoutResult) {
                  printTopic.broadcast(`print`, printLayoutResult.reactComponentString)
                }
              }
            }

            const integrations = profile.options.integrations
            if (data.type !== 'T' && integrations && integrations.grovenfe) {
              try {
                const groveNfePayments = integrations.grovenfe.config.fiscal_notes.forms_payments
                if (groveNfePayments.some(formpayment => formpayment.type === data.formsPayment[0].payment)) {
                  const companyId = integrations.grovenfe.company_id
                  const { data: { company } } = await axios.get(`${Env.get('GROVE_NFE_URL')}/companies/${companyId}`, {
                    headers: {
                      Authorization: `Bearer ${Env.get('GROVE_NFE_TOKEN')}`,
                    },
                  })

                  const { data: { focus_note } } = await axios.post(`${Env.get('V3_API')}/grovenfe/convertToFocusNote`, { cart, company })

                  await axios.post(`${Env.get('GROVE_NFE_URL')}/fiscalNotes/create/${companyId}`, {
                    external_id: String(cart.id),
                    nfce: focus_note,
                  }, {
                    headers: {
                      Authorization: `Bearer ${Env.get('GROVE_NFE_TOKEN')}`,
                    },
                  }
                  )

                }
              } catch (error) {
                console.error('Erro ao criar a nota fiscal:', error);
              }
            }
            console.log('Transação finalizada com sucesso')
            return response.json({ cart })
          } catch (error) {
            console.error('erro 498')
            console.error(error)
            throw error
          }
        })
        .catch((error) => {
          console.error('Houve um erro na transação do pedido.')
          console.error(error)
          if (error.code) {
            return response.status(error.code).json(error)
          }
        })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async status({ params, request, response }) {
    try {
      const { status } = request.all()
      const cart = await Cart.query().where('id', params.cartId).with('itens').first()
      const cartJSON = cart.toJSON()
      cart.status = status

      if (status === 'canceled') {
        for (const cartItem of cartJSON.itens) {
          await InventoryProvider.restoreProductDisponibility(cartItem)
        }
        if (cart.voucherId) {
          try {
            await axios.patch(`${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/vouchers/update/${cart.voucherId}`, {
              status: 'cancelled',
            })
          } catch (error) {
            console.error(error)
          }
        }
      }
      if (status === null) {
        const complementVerification = await InventoryProvider.verifyCartComplementsAvailability(cartJSON)
        await InventoryProvider.updateComplementAvailability(complementVerification)
        for (const cartItem of cartJSON.itens) {
          await InventoryProvider.updateProductDisponibility(cartItem)
          if (cartItem.pizzaId) {
            await InventoryProvider.updatePizzaFlavors(cartItem)
          }
        }
        if (cart.voucherId) {
          try {
            await axios.patch(`${Env.get('RT4', 'https://rt4.whatsmenu.com.br')}/api/v3/vouchers/update/${cart.voucherId}`, {
              status: 'avaliable',
            })
          } catch (error) {
            console.error(error)
          }
        }
      }
      await cart.save()
      // await cart.load('itens')

      // if (cart.status !== null) {
      //   const profile = await cart.profile().fetch()
      //   const client = await cart.client().fetch()
      //   if (client) {
      //     let body = ''
      //     switch (cart.status) {
      //       case 'production':
      //         body = profile.options.placeholders.statusProduction.replace('[NOME]', client.name)
      //       break;
      //       case 'transport':
      //         if (cart.addressId) {
      //           body = profile.options.placeholders.statusSend.replace('[NOME]', client.name)
      //         } else {
      //           body = profile.options.placeholders.statusToRemove.replace('[NOME]', client.name)
      //         }
      //       break;
      //       case 'canceled':
      //         body = 'Pedido cancelado pelo estabelecimento.'
      //       break;
      //       default:
      //         return;
      //     }

      //     const { status, id } = cart.toJSON()

      //     try {
      //       await axios.post(`${Env.get('PUSH_SERVICE_URL')}/subscriptions/sendNotification`, {
      //         clientId: client.id,
      //         notification: {
      //           title: `${profile.name} - Pedido atualizado!`,
      //           body,
      //           vibrate: [100, 50, 100],
      //           icon: profile.logo,
      //           data: {
      //             onActionClick: {
      //               default: { operation: "navigateLastFocusedOrOpen", url: `https://whatsmenu.com.br/${profile.slug}/status/${cart.code}` }
      //             }
      //           }
      //         },
      //         payload: { cart: { status, id } } },
      //         {
      //           headers: { Authorization: `Bearer ${Env.get('PUSH_SERVICE_TOKEN')}`
      //         }
      //       })
      //     } catch (error) {
      //       console.error("Não foi possível enviar notificação", error);
      //     }
      //   }
      // }

      return response.json({
        cart,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async signMotoboy({ request, response }) {
    try {
      const { motoboyId, cartId } = request.all()
      const cart = await Cart.find(cartId)
      cart.motoboyId = motoboyId
      await cart.save()

      return response.json({
        cart,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async confirmCartPrint({ auth, response, params }) {
    try {
      console.log('Starting: ', { controller: 'CartController', linha: 378, metodo: 'confirmCartPrint' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const cart = await profile.carts().where('id', params.cartId).first()

      if (cart) {
        cart.print = 1
        await cart.save()

        return response.json({
          cart,
        })
      }

      throw {
        status: 403,
        error: '403-309',
        message: 'this request not belongs your user!',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async retrieveOrder({ auth, request, response }) {
    try {
      const { orderId } = request.params
      const cart = await CartR.query().where('id', orderId).first()
      return response.json(cart)
    } catch (error) {
      console.error(error)
    }
  }

  async updateCartFormsPayment({ request, response }) {
    try {
      const { cartId, formsPayment, paymentType } = request.all()
      const cart = await Cart.query().where('id', cartId).with('cupom').first()
      if (!cart) {
        throw new Error('Pedido não encontrado')
      }
      cart.formsPayment = formsPayment
      if (paymentType === 'online') {
        if (cart.statusPayment === 'pending') {
          if (CartController.getTotalFormsPayment(cart) >= CartController.getTotalcartValue(cart)) {
            cart.statusPayment = 'paid'
            await cart.save()
            await CartController.generateVouchers(cart, response)
          }
        }
      } else {
        cart.statusPayment = 'offline'
      }
      await cart.save()
      return response.json({ cart })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  static async changeOrderPaymentStatus(orderId, status) {
    try {
      const cart = await Cart.query()
        .where('id', orderId)
        .with('itens')
        .with('cupom')
        .with('address')
        .with('cupom')
        .with('command', (commandQuery) => commandQuery.with('opened', (openedQuery) => openedQuery.with('commands.carts').with('table')))
        .with('bartender')
        .with('cashier')
        .with('client', (clientQuery) => clientQuery.setVisible(['name', 'whatsapp', 'controls']))
        .first()
      if (CartController.getTotalFormsPayment(cart) >= CartController.getTotalcartValue(cart)) {
        const profile = await cart.profile().first()
        cart.statusPayment = status
        await cart.save()
        await CartController.generateVouchers(cart)
        const requestTopic = Ws.getChannel('request:*').topic(`request:${profile.slug}`)
        const printTopic = Ws.getChannel('print:*').topic(`print:${profile.slug}`)
        if (requestTopic) {
          requestTopic.broadcast(`request:${profile.slug}`, [{ ...cart.toJSON() }])
        }
        if (printTopic) {
          printTopic.broadcast(`print:${profile.slug}`, [{ ...cart.toJSON() }])
        }
      }
      return cart.toJSON()
    } catch (error) {
      console.error(error)
    }
  }

  getTotalValue(command, only, value = 0) {
    const commandTotal = command.carts.reduce((commandTotal, request) => {
      if (request.status !== 'canceled') {
        commandTotal += request.total
      }
      return commandTotal
    }, 0)

    const feeTotal = command.fees.reduce((feeTotal, fee) => {
      if (fee.status && fee.automatic) {
        if (fee.type === 'percent') {
          feeTotal += (fee.value / 100) * commandTotal
        } else {
          feeTotal += fee.quantity ? fee.quantity * fee.value : 0
        }
      }
      return feeTotal
    }, 0)

    const formsPaymentTotal = command.formsPayment.reduce((formsPaymentTotal, formPayment) => formsPaymentTotal + formPayment.value, 0)

    const total = commandTotal + feeTotal + formsPaymentTotal
    switch (only) {
      case '':
        return total
      case 'fee':
        return feeTotal
      case 'commandFee':
        return commandTotal + feeTotal
      case 'formsPayment':
        return formsPaymentTotal
      case 'command':
        return commandTotal
      case 'lack':
        return Math.max(commandTotal + feeTotal - formsPaymentTotal - value, 0)
      case 'paid':
        return formsPaymentTotal + value
    }
  }

  //Encomendas

  async cartsPackage({ auth, request, response }) {
    try {
      let { page, perPage } = request._qs

      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()

      const carts = await profile
        .carts()
        .with('itens')
        .with('address')
        .with('client', (qClient) => {
          qClient.setHidden(['last_requests'])
        })
        .with('cupom')
        .with('command.opened.table') // .with('command', (commandQuery) => commandQuery.with('opened', (openedQuery) => openedQuery.with('commands.carts').with('table')))
        .with('bartender')
        .with('cashier', (qCashier) => {
          qCashier.setHidden(['transactions', 'closedValues_system'])
        })
        .where('type', 'P')
        .where('packageDate', '>=', moment().format('YYYY-MM-DD'))
        .orderBy('id', 'asc')
        .paginate(page, 200)

      page = Number(page)

      if (page) {
        const countCarts = []
        const cartsPackageDate = []
        let cartCount

        do {
          cartCount = await profile
            .carts()
            .where('type', 'P')
            .where('packageDate', '>=', DateTime.local().setZone(profile.timeZone).toFormat('yyyy-MM-dd'))
            .with('cupom')
            .with('itens')
            .with('client')
            .orderBy('packageDate')
            .paginate(page, 100)

          countCarts.push(...cartCount.rows)
          page++
        } while (page <= cartCount.pages.lastPage)

        countCarts.forEach((request) => {
          const idV = DateTime.fromJSDate(request.packageDate).toFormat('MMdd')
          const index = cartsPackageDate.findIndex((el) => el.id === idV)

          if (index === -1) {
            cartsPackageDate.push({
              id: idV,
              date: request.packageDate,
              max: 1,
            })
          } else {
            cartsPackageDate[index].max += 1
          }
        })

        carts.datesLength = cartsPackageDate
        carts.rows.forEach((cart) => {
          cart.packageDate = DateTime.fromJSDate(new Date(cart.packageDate)).toSQL()
        })
      }

      return response.json({
        packageCarts: carts,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updatePackageDate({ request, params, response }) {
    try {
      const { id } = params
      const data = request.except(['_csrf'])
      const cart = await Cart.find(id)

      if (data.package && cart) {
        if (cart.type === 'P') {
          cart.packageDate = data.package
          await cart.save()

          return response.json({
            cart,
          })
        }
      }

      throw {
        status: 404,
        message: 'Data not received or cart not found',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  normalizeString(text) {
    if (text) {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
    }
    return text
  }

  static getTotalFormsPayment(cart) {
    const { formsPayment, cupom, taxDelivery } = cart.toJSON()
    let cartTotal = formsPayment.reduce((total, formPayment) => {
      if (formPayment.payment === 'money' && formPayment.change) {
        total += formPayment.change - formPayment.value
      } else {
        total += formPayment.value
      }
      return total
    }, 0)
    return Number(cartTotal.toFixed(2))
  }

  static getTotalcartValue(cart) {
    const { cupom, taxDelivery, total, formsPayment } = cart.toJSON()
    let cartTotal = total + Number(taxDelivery)

    if (cupom) {
      let cupomValue = 0
      switch (cupom.type) {
        case 'percent':
          cupomValue = cartTotal * (Number(cupom.value) / 100)
          break
        case 'value':
          cupomValue = Number(cupom.value)
          break
        case 'freight':
          cupomValue = taxDelivery
          break
      }
      cartTotal -= cupomValue
    }
    return Number(cartTotal.toFixed(2))
  }

  async updateCartControls({ request, params, response }) {
    try {
      const { cartId } = params
      const { controls } = request.all()
      const cart = await Cart.find(cartId)
      cart.controls = { ...cart.controls, ...controls }
      await cart.save()
      return response.json({ cart })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = CartController
