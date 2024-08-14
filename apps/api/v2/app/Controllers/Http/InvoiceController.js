'use strict'

const { BIG5_BIN } = require('mysql/lib/protocol/constants/charsets')

const SystemRequest = use('App/Models/SystemRequest')

const User = use('App/Models/User')
const UserR = use('App/Models/ReadOnly/User')
const Invoice = use('App/Models/Invoice')
const FlexPlan = use('App/Models/FlexPlan')
const UserPlan = use('App/Models/UserPlan')
const SystemProduct = use('App/Models/SystemProduct')
const moment = use('moment')
const PaymentController = use('App/Controllers/Http/PaymentController')
const View = use('View')
const Env = use('Env')
const axios = use('axios')

class InvoiceController {
  async index({ response, view, auth }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 18, metodo: 'index' })
      const user = await auth.getUser()

      const invoices = await user
        .invoices()
        .with('requests', (request) => {
          request.whereIn('status', ['reserved', 'paid', 'completed'])
        })
        .whereIn('type', ['first', 'monthly'])
        .orderBy('id', 'desc')
        .fetch()

      let invoicesAddons = await user
        .invoices()
        .with('requests')
        .where({
          type: 'addon',
          status: 'pending',
        })
        .where('expiration', '>=', moment().format())
        .fetch()

      // const systemRequests = await user.requests().orderBy('id', 'desc').fetch()
      // const lastPaid = systemRequests.rows.find(sr => sr.status === 'paid' || sr.status === 'completed' || sr.status === 'reserved')
      // const srs = systemRequests ? systemRequests.toJSON() : null

      const allInvoices = invoices.toJSON()

      // if (srs) {
      //   srs.forEach(sr => {
      //     if (sr.type === 'A') {
      //       const mensalty = srs.find(m => m.type === 'M' && m.created_at < sr.created_at)
      //       sr.expiration = mensalty.expiration
      //     }
      //   })
      // }

      invoicesAddons = invoicesAddons.rows.length ? invoicesAddons.toJSON() : null

      // View.global('translateStatus', (status) => {
      //   let translate
      //   switch (status) {
      //     case 'paid':
      //       translate = 'Pago'
      //       break;

      //     case 'completed':
      //       translate = 'Pago'
      //       break;

      //     case 'canceled':
      //       translate = 'Cancelado'
      //       break;

      //     case 'pending':
      //       translate = 'Pendente'
      //       break;

      //     case 'refunded':
      //       translate = 'Estornado'
      //       break;

      //     case 'processing':
      //       translate = 'Em Analise'
      //       break;

      //     case 'reserved':
      //       translate = 'Aguardando Confirmação'
      //       break;
      //   }

      //   return translate
      // })

      // const glti = await this.getLastInvoiceObject({response: response, auth: auth})
      View.global('getLastInvoice', () => allInvoices[0])

      // const lastMensality = await user.requests().where('type', 'M').last()
      return response.json({
        dayDue: user.due < 10 ? `0${user.due}` : user.due,
        due:
          invoices.rows.length > 0 && allInvoices[0].expiration
            ? moment(allInvoices[0].expiration).format('DD/MM/YYYY')
            : user.due < 10
              ? `0${user.due}`
              : user.due + moment().format('/MM/YYYY'), //moment(d).add(7, 'days').format('DD/MM/YYYY'),

        invoices: allInvoices.filter((a) => ['completed', 'paid', 'reserved'].includes(a.status)),
        // invoiceOpened: systemRequests.rows[0] && (systemRequests.rows[0].status != 'paid' && systemRequests.rows[0].status != 'completed' && systemRequests.rows[0].status != 'reserved') ? systemRequests.rows[0].toJSON() : null
        invoiceOpened: invoices.rows.length > 0 && allInvoices[0] && allInvoices[0].status !== 'paid' ? [allInvoices[0]] : [],
        invoicesAddons,
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
    }
  }

  async cancelInvoice(transaction) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 105, metodo: 'cancelInvoice' })
      const paghiper = await axios.post('https://api.paghiper.com/transaction/cancel/', {
        apiKey: Env.get('PAGHIPER_APIKEY'),
        token: Env.get('PAGHIPER_TOKEN'),
        status: 'canceled',
        transaction_id: transaction,
      })

      let invoice
      if (
        paghiper.data.cancellation_request.result === 'success' ||
        paghiper.data.cancellation_request.response_message.includes('status atual do pedido é canceled')
      ) {
        invoice = await SystemRequest.findBy('transactionId', transaction)
        const getDateLimit = () => {
          let limit = moment().add(3, 'day')

          switch (limit.format('dddd')) {
            case 'Saturday':
              limit = limit.add(2, 'days').format('YYYY-MM-DD')
              break
            case 'Sunday':
              limit = limit.add(1, 'days').format('YYYY-MM-DD')
              break

            default:
              limit = limit.format('YYYY-MM-DD')
              break
          }

          return limit
        }

        invoice.limit = getDateLimit()
        await invoice.save()
      }
      return {
        success: true,
        paghiper: paghiper.data,
        invoice: invoice ? invoice.toJSON() : null,
      }
    } catch (error) {
      throw error
    }
  }

  async getLastInvoice({ response, auth }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 149, metodo: 'getLastInvoice' })
      const user = await UserR.find(auth.user.id)
      const all = {
        invoice: await this.getLastInvoiceObject({ response: response, auth: auth }),
        addons: await user
          .invoices()
          .with('requests')
          .where({
            type: 'addon',
            status: 'pending',
          })
          .fetch(),
      }
      return response.json(all)
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

  async getLastInvoiceObject({ response, auth }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 164, metodo: 'getLastInvoiceObject' })
      const user = await auth.getUser()

      if (user.controls.disableInvoice && !user.controls.paymentInfo) {
        return null
      }

      if (user.controls.disableInvoice && user.controls.paymentInfo) {
        const invoice = await user.invoices().whereIn('type', ['first', 'monthly']).where('status', 'pending').last()
        return invoice
      }

      const invoice = await user.invoices().whereIn('type', ['first', 'monthly']).last()

      let lastRequest = await invoice.requests().last()

      if (!lastRequest || invoice.status === 'paid') {
        return null
      }

      if (invoice.status !== 'paid') {
        lastRequest = lastRequest.toJSON()
        let due_date
        const paghiper = Array.isArray(lastRequest.paghiper) ? lastRequest.paghiper[0] : lastRequest.paghiper
        if (Object(paghiper).hasOwnProperty('charge')) {
          const charge = paghiper.charge
          due_date = charge.due_at
          return null
        }

        if (Object(paghiper).hasOwnProperty('create_request')) {
          const create_request = paghiper.create_request
          due_date = create_request.due_date

          if (moment(due_date) < moment() && lastRequest.status !== 'paid') {
            const { invoice: lastRequestUpdated } = await this.cancelInvoice(lastRequest.transactionId)
            lastRequest = lastRequestUpdated ? lastRequestUpdated : lastRequest
            console.log('CANCELANDO...', lastRequest)
          }

          if (lastRequest.status === 'canceled' || (lastRequest.limit && moment(lastRequest.paghiper[0].create_request.due_date) < moment())) {
            console.log('CAIU AQUI TA CERTO MAS NÃO TA GERANDO')
            lastRequest = await PaymentController.createNewInvoiceToUser(user.id, paghiper.create_request.value_cents)
          }

          console.log('nem CAIU', !!lastRequest.status === 'canceled', !!lastRequest.limit)

          if (lastRequest.userId === user.id && lastRequest.status === 'pending') {
            // lastRequest.paghiper = paghiper

            if (moment() > moment(lastRequest.expiration)) {
              lastRequest.overdue = true
            }
          }
          return lastRequest
        }
      }
    } catch (error) {
      console.error({
        date: moment().format(),
        user: auth.user.id,
        error: error,
      })
      throw error
    }
  }

  async getErrosBlockeds({ response }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 228, metodo: 'getErrosBlockeds' })
      console.log('entrou')
      const users = await User.all()
      const problems = []

      for (let user of users.rows) {
        if (!user.controls.disableInvoice) {
          const monthly = await user.requests().where('type', 'M').where('expiration', 'like', moment().format('YYYY-MM-%')).first()
          if (monthly) {
            const invoices = await user.requests().where('created_at', '>=', monthly.created_at).fetch()

            const paid = invoices.rows.find((i) => i.status === 'paid' || i.status === 'reserved' || i.status === 'completed')
            if (invoices.rows.length > 0 && paid && paid.id !== invoices.rows[invoices.rows.length - 1].id) {
              problems.push(user.id)
            }
          }
        }
      }
      console.log(problems)
      response.json(problems)
    } catch (error) {
      console.error(error)
      response.send(error)
    }
  }

  async systemRequestsToInvoices({ response }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 256, metodo: 'systemRequestsToInvoices' })
      const users = await User.all()
      const systemRequests = []
      for (const user of users.rows) {
        const invoice = await user.requests().fetch()
        const invoiceJSON = invoice && invoice.toJSON()
        systemRequests.push(invoice && invoiceJSON)
      }
      for (const invoices of systemRequests) {
        let firstInvoice = invoices.shift()
        let user = firstInvoice && (await User.find(firstInvoice.userId))
        let userJSON = user && user.toJSON()
        if (firstInvoice) {
          let newInvoiceFirst = await Invoice.create({
            userId: firstInvoice.userId,
            status: firstInvoice.status === 'paid' || firstInvoice.status === 'completed' || firstInvoice.status === 'reserved' ? 'paid' : 'canceled',
            type: 'first',
            expiration: firstInvoice.expiration,
            value: userJSON.controls.serviceStart ? 199.8 : 49.9,
            itens: {},
          })

          let system_request = await SystemRequest.find(firstInvoice.id)
          system_request.merge({ invoiceId: newInvoiceFirst.id })
          await system_request.save()

          if (invoices.length > 0) {
            for (const invoice of invoices) {
              if (invoice.type === 'M') {
                let newInvoice = await Invoice.create({
                  userId: invoice.userId,
                  status: 'pending',
                  type: 'monthly',
                  expiration: invoice.expiration,
                  value: 49.9,
                  itens: {},
                })

                system_request = await SystemRequest.find(invoice.id)
                system_request.merge({ invoiceId: newInvoice.id })
                await system_request.save()
              }
            }
          }
        }
      }

      return response.json(systemRequests)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateStatusInvoices({ response }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 312, metodo: 'updateStatusInvoices' })
      const users = await User.all()

      for (const user of users.rows) {
        var userInvoices = await user.invoices().fetch()
        const firstInvoice = userInvoices.rows.shift()
        let defineFirst = firstInvoice && firstInvoice.status === 'canceled' ? true : false
        for (const element of userInvoices.rows) {
          let requests = await user.requests().where('userId', user.id).where('expiration', element.expiration).fetch()
          let status = requests
            .toJSON()
            .find((invoice) => invoice.status === 'paid' || invoice.status === 'completed' || invoice.status === 'reserved')
          if (defineFirst) {
            element.type = 'first'
            if (element.status === 'paid') defineFirst = false
          } else {
            element.type = 'monthly'
          }

          element.status = status ? 'paid' : 'canceled'

          element.updated_at = status && status.updated_at

          requests = await user.requests().whereNull('invoiceId').where('expiration', element.expiration).fetch()
          // if (requests.toJSON().length > 0) console.log({ userId: user.id, requests: requests.toJSON().length});
          for (const invoice of requests.rows) {
            if (element.userId === 434) console.log(element.id)
            let newInvoice = await SystemRequest.find(invoice.id)
            newInvoice.merge({ invoiceId: element.id })
            await newInvoice.save()
          }

          let newInvoice = await Invoice.find(element.id)
          newInvoice.merge({ status: element.status, type: element.type })
          await newInvoice.save()
        }
      }

      return response.json(userInvoices)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async generateUpgrade({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'InvoiceController', linha: 357, metodo: 'generateUpgrade' })
      const { plan } = request.all()
      const user = await auth.getUser()
      const invoice = await user.invoices().where('expiration', 'like', moment().format('YYYY-MM-%')).first()
      const flexPlan = await FlexPlan.findBy('category', plan)
      const today = moment()
      let price

      let value = 0

      const product = await SystemProduct.query()
        .where('plan_id', flexPlan.id)
        .andWhere('operations', 'LIKE', user.controls.period ? user.controls.period : 'monthly')
        .first()
      price = product.operations.prices.find((pr) => pr.id === product.default_price)

      if (!user.controls.period || user.controls.period === 'monthly') {
        console.log('345 - teste')

        let due = moment(moment().format(`YYYY-MM-${user.due < 10 ? `0${user.due}` : user.due}T00:00:00`))

        if (invoice) {
          console.log('350 - teste')
          due = moment(
            moment()
              .add(1, 'month')
              .format(`YYYY-MM-${user.due < 10 ? `0${user.due}` : user.due}T00:00:00`)
          )
        }

        const diff = today.diff(due, 'day')

        if (product) {
          value = (price.currency_options[user.controls.currency].unit_amount / 100 / 30) * (diff <= 7 ? 0 : diff)
        } else {
          value = (flexPlan.monthly.value / 30) * (diff <= 7 ? 0 : diff)
        }
      } else {
        const due = moment(moment(user.controls.nextInvoice))
        const diff = today.diff(due, 'day')

        if (product) {
          value = (price.currency_options[user.controls.currency].unit_amount / 100 / 30) * (diff <= 7 ? 0 : diff)
        } else {
          value = (flexPlan[user.controls.period].value / 30) * (diff <= 7 ? 0 : diff)
        }
      }

      const newinvoice = await Invoice.create({
        userId: user.id,
        status: value > 0 ? 'pending' : 'paid',
        type: 'upgrade',
        expiration: moment().add(1, 'days').format('YYYY-MM-DD'),
        value: value,
        itens: [{ id: flexPlan.id, name: product.name, value: price.currency_options[user.controls.currency].unit_amount / 100 }],
      })

      console.log(`374 - teste aqui 1: ${value}`)
      if (value > 0) {
        await PaymentController.createPaghiperToInvoice(newinvoice.id)
      } else {
        console.log(`378 - ${JSON.stringify(newinvoice.itens)}`)
        await UserPlan.create({
          userId: user.id,
          flexPlanId: newinvoice.itens[0].id,
        })
      }

      const retInvoice = await Invoice.query()
        .where('id', newinvoice.id)
        .where('type', 'upgrade')
        .with('requests', (request) => {
          return request.where('status', 'pending').where('limit', null)
        })
        .last()

      return response.json(retInvoice)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getInvoiceById({ params, response }) {
    console.log('Starting: ', { controller: 'InvoiceController', linha: 427, metodo: 'getInvoiceById' })
    const invoice = await Invoice.find(params.invoiceId)

    console.log('aqui: 419', invoice)
    return response.json(invoice)
  }

  async generateAddonInvoice({ request, response }) {
    try {
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)
      // data.itens.forEach(i => {
      //   i.value = parseFloat(i.value.replace(',', '.'))
      //   i.quantity = parseInt(i.quantity)
      // })
      // const user = await User.find(data.userId)
      const invoice = await Invoice.create({
        userId: data.userId,
        type: 'addon',
        status: 'pending',
        installments: data.installments,
        expiration: moment().add(3, 'days').format('YYYY-MM-DD'),
        itens: data.items,
        value: data.items.reduce((acc, b) => acc + b.value * b.quantity, 0),
      })

      if (!user.controls.disableInvoice) {
        const request_invoice = await PaymentController.createPaghiperToInvoice(invoice.id)

        invoice.requests = [request_invoice]
      }

      return response.json({
        success: true,
        response: invoice,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = InvoiceController
