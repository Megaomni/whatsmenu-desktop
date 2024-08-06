'use strict'

const { default: axios } = require('axios')
const stripe = require('../../../stripe')
const gatewayPagarme = require('../../Services/gateways/strategyPagarme')
const gatewayStripe = require('../../Services/gateways/strategyStripe')
const gatewayGrovePay = require('../../Services/gateways/strategyGrovePay')
const AsaasProvider = use('AsaasProvider')
const User = use('App/Models/User')
const Profile = use('App/Models/Profile')
const Client = use('App/Models/Client')
const CartController = use('App/Controllers/Http/CartController')
const Hash = use('Hash')
const { DateTime } = require('luxon')
const { Customer, Payment } = require('../../Classes/Aasas')
const Asaas = require('../../Services/gateways/asaas')
const SystemProduct = use('App/Models/SystemProduct')
const SystemRequest = use('App/Models/SystemRequest')
const Command = use('App/Models/Command')
const TableOpened = use('App/Models/TableOpened')
const Cart = use('App/Models/Cart')
const FlexPlan = use('App/Models/FlexPlan')
const Invoice = use('App/Models/Invoice')
const Env = use('Env')
const PixGenerator = use('PixGenerator')
const { randomBytes } = require('crypto')
class GatewayController {
  // -------- STRIPE -------- //
  async stripeEvents({ request, response }) {
    const buffer = async (readable) => {
      const chunks = []

      for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
      }
      return Buffer.concat(chunks)
    }

    try {
      const buf = await buffer(request._raw)
      const secret = request.header('stripe-signature')
      const relevantEvents = new Set([
        'checkout.session.completed',
        'customer.source.created',
        'customer.source.deleted',
        'customer.source.updated',
        'customer.subscription.created',
        'customer.subscription.deleted',
        'invoice.created',
        'invoice.payment_failed',
        'invoice.payment_succeeded',
        'invoice.upcoming',
        'invoice.updated',
        'invoiceitem.created',
        'payment_intent.payment_failed',
        'payment_intent.succeeded',
        // 'price.created',
        // 'price.updated',
        // 'product.created',
        // 'product.updated'
      ])

      const event = stripe.webhooks.constructEvent(buf, secret, Env.get('STRIPE_WEBHOOK_SECRET'))

      if (relevantEvents.has(event.type)) {
        const data = event.data.object
        switch (event.type) {
          case 'checkout.session.completed':
            await gatewayStripe.webhookChargePaid(data)
            break
          case 'customer.source.created':
            await gatewayStripe.webhookCardCreated(event)
            break
          case 'customer.source.deleted':
            await gatewayStripe.webhookDeletedCard(event)
            break
          case 'customer.source.updated':
            await gatewayStripe.webhookUpdatedCard(event)
            break
          case 'customer.source.deleted':
            await gatewayStripe.webhookDeletedCard(event)
            break
          case 'customer.subscription.created':
            await gatewayStripe.webhookSubscriptionCreated(event)
            break
          case 'customer.subscription.deleted':
            await gatewayStripe.webhookSubscriptionCanceled(event)
            break
          case 'invoice.created':
            await gatewayStripe.webhookInvoiceCreated(event)
            break
          case 'invoice.payment_succeeded':
            await gatewayStripe.webhookInvoicePaid(event)
            break
          case 'invoice.payment_failed':
            await gatewayStripe.webhookFailedInvoicePayment(event)
            break
          case 'invoice.upcoming':
            /* Invoices upcoming são invoices criadas com status
             * upcoming e ainda não estão disponíveis para serem pagas;
             */
            await gatewayStripe.webhookInvoiceCreated(event)
            break
          default:
            console.log('Este evento não esta sendo monitorado', event.type)
        }
      }

      return response.json({ ok: true })
    } catch (error) {
      if (error.response.data) {
        console.error(error.response.data)
      }
      // console.error(error)
      throw error
    }
  }

  async stripeCancelSubscription({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const subscription = await gatewayStripe.cancelSubscription(user.controls.paymentInfo.subscription.id, data)

      user.controls.paymentInfo.subscription.status = 'canceled'

      await user.save()
      return response.json(subscription)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeCreateCard({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      data.customerId = user.controls.paymentInfo.customerId

      const card = await gatewayStripe.createCard(data)

      const userCard = {
        id: card.id,
        type: card.funding,
        brand: card.brand,
        status: 'active',
        expYear: card.exp_year,
        expMonth: card.exp_month,
        holderName: card.name,
        lastDigits: card.last4,
        firstDigits: '*****',
      }

      if (user.controls.paymentInfo.cards) {
        user.controls.paymentInfo.cards.push(userCard)
      } else {
        user.controls.paymentInfo.cards = [userCard]
      }

      await user.save()
      return response.json(card)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeCreateCardToken({ request, response, auth }) {
    try {
      const data = request.except(['csrf'])
      const user = await auth.getUser()

      const token = await gatewayStripe.createCardToken({
        ...data,
        customerId: user.controls.paymentInfo.customerId,
      })

      return response.json(token)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeCreateCheckout({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      const dataCheckout = {
        customerId: user.controls.paymentInfo.customerId,
        currency: user.controls.currency,
        line_items: data.line_items,
        mode: data.mode,
        success_url: data.success_url,
        cancel_url: data.cancel_url,
        metadata: {
          invoices: data.invoices,
          userId: user.id,
        },
      }

      const checkoutData = await gatewayStripe.createCheckoutOrPurchaseCard(dataCheckout)

      return response.json(checkoutData)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeCreateCustomer({ response, auth }) {
    try {
      const user = await auth.getUser()
      const customer = await gatewayStripe.createCustomer(user.toJSON())

      if (!user.controls.paymentInfo.customerId) {
        user.controls.paymentInfo.customerId = customer.id
        await user.save()

        return response.json(customer)
      }

      throw {
        status: 403,
        message: 'This user already have a customer id',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeCreateSubscriptions({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      const metadata = {
        userId: user.id,
      }
      const default_source_card = data.cardId ? data.cardId : user.controls.paymentInfo.default_card

      const subscription = await gatewayStripe.createSubscription({
        customerId: user.controls.paymentInfo.customerId,
        items: data.line_items,
        metadata: metadata,
        cardId: default_source_card,
        currency: user.controls.currency,
      })

      return response.json(subscription)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeDeleteCard({ request, params, response, auth }) {
    try {
      const { cardId } = params
      if (cardId) {
        const user = await auth.getUser()
        const customerId = user.controls.paymentInfo.customerId

        const deletedCard = await gatewayStripe.deleteCard({ customerId, cardId })

        user.controls.paymentInfo.cards = user.controls.paymentInfo.cards.filter((card) => {
          return card.id !== deletedCard.id
        })

        await user.save()

        return response.json(deletedCard)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeDeleteSubscriptionItem({ request, response }) {
    try {
      const data = request.except(['_csrf'])
      const user = await User.find(request.userId)

      if (user && data.userId) {
        const deletedItem = await gatewayStripe.deleteSubscriptionItem(data, user.controls.paymentInfo.subscription.id)

        if (deletedItem) {
          return response.json(deletedItem)
        }

        throw {
          status: 204,
          message: 'No items were deleted, review the data',
        }
      }

      throw {
        status: 403,
        message: 'User not found',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async stripeUpdateSubscriptionCard({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      if (user.controls.paymentInfo.cards) {
        const card = user.controls.paymentInfo.cards.find((card) => card.id === data.cardId)

        if (card) {
          const subscriptionChange = await gatewayStripe.updateChargeOrSubscriptionCard({
            subscriptionId: user.controls.paymentInfo.subscription.id,
            cardId: card.id,
          })

          user.controls.paymentInfo.default_card = subscriptionChange.default_source
          await user.save()

          return response.json({
            subscription: user.controls.paymentInfo.subscription.id,
            card: {
              id: subscriptionChange.default_source,
            },
          })
        }
      }

      throw {
        status: 403,
        message: 'No cards found for this user',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  // -------- PAGARME -------- //
  async pagarmeEvents({ request, response }) {
    try {
      const relevantEvents = new Set([
        'card.created',
        'card.deleted',
        'card.expired',
        'charge.paid',
        'charge.payment_failed',
        'invoice.canceled',
        'invoice.created',
        'invoice.paid',
        'invoice.payment_failed',
        'order.paid',
        // "order.payment_failed",
        'subscription.canceled',
        'subscription.created',
      ])
      const event = request.except(['_csrf'])

      console.log({
        Starting: 'PagarmeEvents',
        metodo: 'pagarmeEvents',
        linha: 352,
        event: event.type,
        user: event.data.customer ? event.data.customer.code : 'Sem cutomer code',
      })

      if (relevantEvents.has(event.type)) {
        switch (event.type) {
          case 'card.created':
            break
          case 'card.deleted':
            await gatewayPagarme.webhookDeletedCard(event)
            break
          case 'order.paid':
            await gatewayPagarme.webhookOrderPaid(event)
            break
          case 'card.expired':
            await gatewayPagarme.webhookExpiredCard(event)
            break
          case 'charge.paid':
            await gatewayPagarme.webhookChargePaid(event)
            break
          case 'charge.payment_failed':
            await gatewayPagarme.webhookChargePaymentFailed(event)
            break
          case 'invoice.canceled':
            await gatewayPagarme.webhookInvoiceCanceled(event)
            break
          case 'invoice.created':
            await gatewayPagarme.webhookInvoiceCreated(event)
            break
          case 'invoice.paid':
            await gatewayPagarme.webhookInvoicePaid(event)
            break
          case 'invoice.payment_failed':
            await gatewayPagarme.webhookFailedInvoicePayment(event)
            break
          case 'subscription.created':
            await gatewayPagarme.webhookSubscriptionCreated(event)
            break
          case 'subscription.canceled':
            await gatewayPagarme.webhookSubscriptionCanceled(event)
            break
          default:
            console.log(`O evento ${event.type} da pagarme, não esta sendo monitorado`)
        }
      }

      return response.json({
        data: {
          message: 'Dados atualizados com sucesso',
        },
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pagarmeAddSubscriptionItem({ request, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const subscriptionId = user.controls.paymentInfo.subscription.id

      if (subscriptionId) {
        const result = await gatewayPagarme.addSubscriptionItem(data, subscriptionId)

        return response.json(result)
      }

      throw {
        message: 'This user does not have an active subscription',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pagarmeCancelSubscription({ request }) {
    try {
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)

      if (user) {
        await gatewayPagarme.cancelSubscription(user.controls.paymentInfo.subscription.id)

        return response.status(204).end()
      }

      throw {
        message: 'User not found for this user id',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pagarmeCreateCard({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      const generateCard = (customerCard) => {
        return {
          id: customerCard.id,
          firstDigits: customerCard.first_six_digits,
          lastDigits: customerCard.last_four_digits,
          holderName: customerCard.holder_name,
          expMonth: customerCard.exp_month,
          expYear: customerCard.exp_year,
          status: customerCard.status,
          brand: customerCard.brand,
          type: customerCard.type,
        }
      }

      let customerId = user.controls.paymentInfo.customerId

      if (!customerId) {
        const { data } = await gatewayPagarme.createCustomer(user.toJSON())
        customerId = data.id

        user.controls.paymentInfo = {
          ...user.controls.paymentInfo,
          customerId: data.id,
          addressId: data.address.id,
        }
      }

      const { data: customerCard } = await gatewayPagarme.createCard({
        token: data.token,
        customerId: customerId,
        billing_address_id: user.controls.paymentInfo.addressId,
      })

      const cardToUser = generateCard(customerCard)

      if (user.controls.paymentInfo.cards) {
        const card = user.controls.paymentInfo.cards.find((cd) => cd.id === customerCard.id)

        if (card) {
          for (const [key, value] of Object.entries(cardToUser)) {
            card[key] = value
          }
        } else {
          user.controls.paymentInfo.cards.push(cardToUser)
        }
      } else {
        user.controls.paymentInfo = {
          ...user.controls.paymentInfo,
          cards: [cardToUser],
        }
      }

      if (!user.controls.paymentInfo.default_card) {
        user.controls.paymentInfo.default_card = customerCard.id
      }

      await user.save()

      return response.json({
        card: cardToUser,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  /** Checkouts Pagarme só podem ser criados para pedidos unicos, não permitidos para cobranças ou subscrições */
  async pagarmeCreateCheckoutOrPurchaseCard({ request, response, auth }) {
    console.log('Starting: ', { controller: 'GatewayController', linha: 537, metodo: 'CreateCheckoutOrPurchaseCard' })

    try {
      const clientIp = request.header('x-real-ip')
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      if (user.controls.paymentInfo) {
        let customerId = user.controls.paymentInfo.customerId

        if (!customerId) {
          const { data: customer } = await gatewayPagarme.createCustomer(user.toJSON())
          customerId = customer.id

          user.controls.paymentInfo = {
            ...user.controls.paymentInfo,
            customerId: customer.id,
            addressId: customer.address.id,
          }

          await user.save()
        }

        const { data: checkout } = await gatewayPagarme.createCheckoutOrPurchaseCard({
          items: data.items,
          user: user.toJSON(),
          clientIp: clientIp,
          payments: data.payments,
          invoices: data.invoices,
          billing_address_id: user.controls.paymentInfo.addressesId,
          metaInstallments: data.installments,
        })

        return response.json({
          checkout,
        })
      }
    } catch (error) {
      if (error.response) {
        console.error(error.response.data)
      } else {
        console.error(error)
      }
      throw error
    }
  }

  async pagarmeCreateCustomer({ auth }) {
    try {
      const user = await auth.getUser()

      if (!user.controls.paymentInfo.customerId) {
        const { id, address } = await gatewayPagarme.createCustomer(user.toJSON())
        customerId = id

        user.controls.paymentInfo = {
          ...user.controls.paymentInfo,
          customerId: id,
          addressId: address.id,
        }

        await user.save()

        return response.json({
          user,
        })
      }

      throw {
        status: 403,
        message: 'This user already has a customer id',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pagarmeCreateSubscriptions({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()

      const customerId = user.controls.paymentInfo.customerId

      if (customerId) {
        if (data.card_id) {
          data.items.forEach((item) => {
            item.cycles = 1
          })

          const dataSubscription = {
            payment_method: `${data.payment_method}`,
            interval: user.controls.period.replace('ly', ''),
            minimum_price: 1000,
            interval_count: 1,
            billing_type: 'prepaid',
            installments: data.installments ? data.installments : 1,
            items: data.items,
            card_id: data.card_id,
            quantity: null,
            currency: 'BRL',
            customer_id: customerId,
            metadata: data.metadata,
          }

          const newSubscription = {}

          const { data: subscription } = await gatewayPagarme.createSubscription(dataSubscription)
          if (subscription.status === 'failed') {
            newSubscription.id = subscription.id
            newSubscription.status = 'canceled'

            user.controls.paymentInfo.subscription = newSubscription
            await user.save()

            return response.status(400).json({
              status: 400,
              code: '400-PF',
              message: 'Sua assinatura não foi criada, verique seus dados de cartão ou certifique-se que há limite disponível',
            })
          } else {
            newSubscription.id = subscription.id
            newSubscription.status = 'active'

            user.controls.paymentInfo.subscription = newSubscription
            await user.save()
          }

          return response.json({
            subscription: newSubscription,
          })
        }

        throw {
          status: 403,
          message: 'Proíbido, este usuário não tem um cartão adicionado',
        }
      }

      throw {
        status: 403,
        message: 'Proíbido, este usuário não tem uma conta cliente criada no gateway',
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.error(error.response.data)
        throw error.response.data
      }

      console.error(error)
      throw error
    }
  }

  async pagarmeDeleteCard({ response, params, auth }) {
    try {
      const user = await auth.getUser()
      const { cardId } = params

      const customerId = user.controls.paymentInfo.customerId
      const { data: result } = await gatewayPagarme.deleteCard({
        customerId,
        cardId,
      })

      user.controls.paymentInfo.cards = user.controls.paymentInfo.cards.filter((card) => {
        return card.id !== cardId
      })

      await user.save()

      return response.json(result)
    } catch (error) {
      console.error(error)
    }
  }

  async pagarmeDeleteSubscriptionItem({ request, response }) {
    try {
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)

      const deletedItem = await gatewayPagarme.deleteSubscriptionItem(data, user.controls.paymentInfo.subscription.id)

      if (deletedItem) {
        return response.json(deletedItem)
      }

      throw {
        status: 204,
        message: 'No items were deleted',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pagarmeUpdateChargeCard({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      if (user.controls.paymentInfo.cards) {
        const card = user.controls.paymentInfo.cards.find((card) => card.id === data.cardId)
        const invoice = await user.invoices().where({ status: 'pending' }).last()

        if (invoice) {
          const systemRequests = await invoice.requests().fetch()
          const systemRequestsJSON = systemRequests.toJSON()

          const systemRequest = systemRequestsJSON.some((sR) => sR.status === 'paid')
            ? null
            : systemRequestsJSON.find((sRequest) => sRequest.status === 'failed')

          try {
            if (systemRequest) {
              const chargeId = systemRequest.paghiper[0].charge.id
              const { data: cardChange } = await gatewayPagarme.changeChargeCard(chargeId, card.id)

              return response.json(cardChange)
            }
          } catch (error) {
            console.error(error)
            if (error.response && error.response.status === 412) {
              const { data } = error.response

              if (data.message && data.message.includes("This charge can't have the card changed because its status is 'paid'.")) {
                invoice.status = 'paid'
                SystemRequest.create({
                  invoiceId: invoice.id,
                  transactionId: systemRequest.paghipder[0].last_transaction.id,
                })
              }
              if (data.checkout) {
                const { data: newCharge } = await gatewayPagarme.createCheckoutOrPurchaseCard({
                  user: user.toJSON(),
                  items: data.line_items,
                  invoices: data.invoices,
                  payments: [
                    {
                      credit_card: {
                        operation_type: 'auth_and_capture',
                        installments: data.installments ? data.installments : 1,
                        card_id: card.id,
                      },
                    },
                  ],
                })

                return response.json({
                  newCharge,
                })
              }
            }
          }
        }

        throw {
          status: 404,
          message: 'Nenhuma fatura foi encontrada, por favor recarregue a pagina e verifique se a fatura existe ou se não esta paga',
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async pagarmeUpdateSubscriptionCard({ request, response, auth }) {
    try {
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const subscriptionId = user.controls.paymentInfo.subscription.id
      if (user.controls.paymentInfo.cards) {
        const card = user.controls.paymentInfo.cards.find((card) => card.id === data.cardId)
        const { data: result } = await gatewayPagarme.changeSubscriptionCard(subscriptionId, card.id)

        user.controls.paymentInfo.default_card = card.id
        await user.save()

        return response.json(result)
      }

      throw {
        status: 403,
        message: 'This user does not a have registered card',
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  // -------- ASAAS -------- //
  async asaasEvents({ request, response }) {
    const event = request.except(['_csrf'])
    console.log('ASAAS EVENT', event)

    try {
      const event = request.except(['_csrf'])
      console.log({
        Starting: 'AsaasEvents',
        metodo: 'asaasEvents',
        linha: 833,
        event: event.event,
      })
      await Asaas.webHookHandler(event)
      return response.json({
        data: {
          message: 'Dados atualizados com sucesso',
        },
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasCreateCustomer({ request, response }) {
    try {
      const body = request.except(['_csrf'])
      const existingUser = await Asaas.listCustomers('cpfCnpj', body.asaas.cpfCnpj, 0, 1)
      let customer
      if (existingUser.data.length > 0) {
        customer = existingUser.data[0]
      } else {
        customer = await Asaas.createCustomer(body.asaas)
      }
      const client = await Client.findBy('id', body.id)
      client.controls = { ...client.controls, asaas: { cards: [], id: customer.id } }
      await client.save()
      return response.json(customer)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasCreateSubAccount({ auth, request, response }) {
    const user = await auth.getUser()
    const profile = await user.profile().fetch()
    const { terms, ...body } = request.all()
    try {
      const { id, apiKey, walletId, accountNumber, loginEmail, mobilePhone } = await Asaas.createAccount(body)

      profile.options.asaas = {
        id,
        accountNumber,
        apiKey,
        walletId,
        loginEmail,
        mobilePhone,
      }
      if (body.incomeValue) {
        profile.options.asaas.incomeValue = body.incomeValue
      }
      profile.options.onlinePix = true
      profile.options.onlineCard = true
      profile.options.legacyPix = false
      profile.options.asaas.terms = terms
      profile.options.asaas.negotiations = {
        pix: [{ fee: 0.49, expiration_date: DateTime.local().plus({ days: 90 }).toFormat('yyyy-MM-dd HH:mm:ss') }],
      }
      profile.options.asaas.advanceCardPayment = false

      profile.formsPayment.forEach((formPayment) => {
        if (formPayment.payment === 'pix') {
          formPayment.status = true
        }
      })

      await profile.save()

      return response.json({ profile, options: { ...profile.options, showAlert: true } })
    } catch (error) {
      throw error
    }
  }

  async asaasUpdateSubAccount({ auth, request, response }) {
    const user = await auth.getUser()
    const profile = await user.profile().fetch()
    const { incomeValue } = request.all()
    try {
      const account = await Asaas.getAccount(profile.options.asaas.id)
      await Asaas.updateAccount(profile.options.asaas.apiKey, { ...account, incomeValue })

      profile.options.asaas.incomeValue = incomeValue

      await profile.save()

      return response.json({ profile, options: { ...profile.options, showAlert: true } })
    } catch (error) {
      throw error
    }
  }

  async updateAdvanceCardPayment({ auth, request, response }) {
    const user = await auth.getUser()
    const profile = await user.profile().fetch()
    const { advanceCardPayment } = request.all()

    try {
      profile.options.asaas.advanceCardPayment = advanceCardPayment
      await profile.save()

      return response.json({ profile, message: 'Advance card payment updated successfully' })
    } catch (error) {
      return response.status(500).json({ error: 'Failed to update advance card payment' })
    }
  }

  async asaasListAccounts({ auth, request, response }) {
    // const user = auth.getUser()
    // const profile = user.profile().fetch()
    // const body = request.all()
    try {
      const accounts = await Asaas.listDocuments()

      return response.json({ accounts })
    } catch (error) {
      throw error
    }
  }

  // Reaproveitar
  async grovepayCreateRecipient({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'GatewayController', linha: 30, metodo: 'grovepayCreateRecipient' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await Profile.query().where('userId', user.id).first()

      if (profile.options.recipient) {
        const daysFromLastUpdate = DateTime.now().diff(DateTime.fromISO(profile.options.recipient.data.created_at), 'days')
        if (daysFromLastUpdate.values.days < 7) {
          return response.status(400).json({ message: 'Você só pode alterar suas informações bancárias uma vez por semana.' })
        }
      }

      const body = {
        default_bank_account: data.default_bank_account,
        transfer_settings: {
          transfer_enabled: true,
          transfer_interval: 'Daily',
          transfer_day: 0,
        },
        automatic_anticipation_settings: {
          enabled: false,
          type: 'full',
          volume_percentage: 0,
          delay: 365,
        },
        name: data.default_bank_account.holder_name,
        email: user.email,
        document: data.default_bank_account.holder_document,
        type: data.default_bank_account.holder_type,
      }

      const grovePayLogin = await gatewayGrovePay.retrieveLoginToken()
      gatewayGrovePay.setSecret(grovePayLogin.access_token)
      const recipient = await gatewayGrovePay.createRecipient(body)
      if (recipient.data.default_bank_account.status !== 'active') {
        return response.status(403).json({ message: 'Erro ao confirmar dados bancários' })
      }
      profile.options.recipient = { id: recipient.data.id, data: recipient.data.default_bank_account, created_at: DateTime.local().toISO() }
      profile.save()
      return response.json({ message: 'Conta bancária adicionada com sucesso.' })
    } catch (error) {
      throw error
    }
  }

  async asaasCreatePixOrder({ request, response }) {
    try {
      let { customer, customerId, billingType, value, description, dueDate, externalReference, walletId, clientId, document, name } = request.all()
      const { slug } = request.params
      const client = await Client.query().where({ id: clientId }).first()
      const profile = await Profile.findBy('slug', slug)
      if (client) {
        client.secretNumber = document
        try {
          await client.save()
        } catch (error) {
          console.error(error)
        }
      }

      if (!customerId) {
        const findCustomer = await Asaas.listCustomers('cpfCnpj', document, 0, 1)
        if (findCustomer.data.length === 0) {
          const newCustomer = new Customer(name, document)
          const customerCreated = await Asaas.createCustomer(newCustomer)
          customer = customerCreated.id
        } else {
          customer = findCustomer.data[0].id
        }

        const messages = await Asaas.findNotificationsByCustomer(customer)
        for (const message of messages.data) {
          if (message.enabled) {
            await Asaas.updateNotification({ enabled: false }, message.id)
          }
        }
      }

      // const profile = await client.profile().fetch()
      let pixFeeSplit = process.env.ASAAS_PIX_FEE

      if (profile.options.asaas.negotiations) {
        const lastNegotiation = profile.options.asaas.negotiations.pix[profile.options.asaas.negotiations.pix.length - 1]
        if (lastNegotiation && DateTime.fromFormat(lastNegotiation.expiration_date, 'yyyy-MM-dd hh:mm:ss').diffNow('days').days > 0) {
          pixFeeSplit = lastNegotiation.fee
        }
      }
      const pixBody = new Payment({
        customer,
        billingType,
        value,
        description,
        dueDate,
        externalReference,
        split: [
          { walletId, fixedValue: value - pixFeeSplit },
          { walletId: process.env.ASAAS_WALLET_2, fixedValue: Math.max((pixFeeSplit - 0.35) * 0.08, 0.01) },
        ],
      })

      const payment = await Asaas.createPayment(pixBody)
      await this.createFormPayment({ payment, externalReference, value, paymentType: 'pix' })

      return response.json({ payment: await Asaas.qrCodePix(payment.id), id: payment.id, paymentId: payment.id })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasVerifyPixPaymentPDV({ request, response }) {
    try {
      const { tableId, commandId, cartId, paymentId } = request.all()
      let payment
      let cart
      if (cartId) {
        cart = await Cart.find(cartId)
        payment = cart.formsPayment.find((f) => f.paymentId === paymentId)
      }

      if (tableId) {
        const opened = await TableOpened.find(tableId)
        payment = opened.formsPayment.find((f) => f.paymentId === paymentId)
      }
      if (commandId) {
        const command = await Command.find(commandId)
        payment = command.formsPayment.find((f) => f.paymentId === paymentId)
      }
      if (!payment) {
        throw new Error('Pagamento não encontrado')
      }

      return response.json({ payment, cart })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasDeletePixPaymentPDV({ request, response }) {
    try {
      const { tableId, commandId, paymentId } = request.all()
      let payment
      if (tableId) {
        const opened = await TableOpened.find(tableId)
        payment = opened.formsPayment.find((f) => f.paymentId === paymentId)
        if (payment.paid) {
          throw new Error('Não foi possivel cancelar, pois o pagamento ja foi efetuado!')
        }
        opened.formsPayment = opened.formsPayment.filter((f) => f.paymentId !== paymentId)
        await opened.save()
        return response.json({ opened })
      }
      if (commandId) {
        const command = await Command.find(commandId)
        payment = command.formsPayment.find((f) => f.paymentId === paymentId)
        if (payment.paid) {
          return new Error('Não foi possivel cancelar, pois o pagamento ja foi efetuado!')
        }
        command.formsPayment = command.formsPayment.filter((f) => f.paymentId !== paymentId)
        await command.save()
        return response.json({ command })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasCreateCardOrder({ request, response }) {
    console.log('asaasCreateCardOrder')
    try {
      const data = request.except(['_csrf'])
      const cardInfo = data.card
      cardInfo.remoteIp = request.header('x-real-ip')
      const orderInfo = data.order
      let creditCardToken = null
      let profile = null

      if (data.card.creditCardNumber) {
        console.log('query client')
        console.time('Verificando cartão')
        const client = await Client.query()
          .whereRaw("JSON_EXTRACT(controls, '$.asaas.id') = ?", [data.order.customer])
          .where({ id: data.clientId })
          .first()
        console.timeEnd('Verificando cartão')

        const token = await this.verifyTokenAccess(client.id, data.card.creditCardNumber, data.card.id)
        if (!token) throw 'Erro ao verificar cartão'
        creditCardToken = token
        profile = await client.profile().fetch()
      }

      const wallet2FixedValue = Math.max(Number(((data.order.value / 100) * 0.06).toFixed(2), 0.01))
      const paymentBody = new Payment({
        ...orderInfo,
        softDescriptorText: profile.slug.substring(0, 13),
        remoteIp: cardInfo.remoteIp,
        creditCardToken: creditCardToken.creditCardToken,
        split: [
          {
            walletId: data.restaurantWalletId,
            fixedValue:
              data.order.value -
              (data.order.value / 100) *
                (profile.options.asaas.advanceCardPayment ? process.env.ASAAS_CC_FEE_ANTECIPATION : process.env.ASAAS_CC_FEE),
          },
          { walletId: process.env.ASAAS_WALLET_2, fixedValue: wallet2FixedValue },
        ],
      })
      console.log('CRIANDO PAGAMENTO ASAAS')
      const payment = await Asaas.createPayment(paymentBody)
      if (payment.status === 'CONFIRMED') {
        const { cartId } = JSON.parse(payment.externalReference)
        await this.createFormPayment({ payment, externalReference: data.order.externalReference, value: data.order.value, paymentType: 'credit' })
        await CartController.changeOrderPaymentStatus(cartId, 'paid')

        if (profile.options.asaas.advanceCardPayment) {
          await Asaas.createPaymentAnticipation({ payment: payment.id })
        }
        return response.json({ message: 'Pagamento confirmado com sucesso', statusPayment: 'paid' })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasCreateToken({ request, response, params }) {
    console.log('start asaasCreateToken')
    console.log(request.all())
    try {
      const card = request.all()
      const remoteIp = request.header('x-real-ip')

      const { surname, type } = request.all()
      const { clientId } = params
      console.log(card)
      if (!card.creditCardHolderInfo.email) {
        card.creditCardHolderInfo.email = `${clientId}@whatsmenu.com.br`
      }
      const client = await Client.find(clientId)
      const { controls } = client.toJSON()
      console.log('passou aqui')
      const cardToken = await Asaas.createCardToken({ ...card, customer: controls.asaas.id, remoteIp })
      console.log('passou aqui2')
      console.log(cardToken)
      const hash = await Hash.make(card.creditCard.ccv)
      const newCard = { ...cardToken, uuid: hash, surname, type }
      client.controls.asaas.cards.push(newCard)
      await client.save()
      return response.json({ client })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async asaasDeleteClientCardToken({ request, response }) {
    try {
      const { clientId, creditCardNumber } = request.all()
      const client = await Client.find(clientId)
      const card = client.controls.asaas.cards.find((card) => card.creditCardNumber === creditCardNumber)
      if (card) {
        client.controls.asaas.cards = client.controls.asaas.cards.filter((c) => c.uuid !== card.uuid)
        await client.save()
      }
      return response.json({ client })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async verifyZipCode(zipCode) {
    const { data } = await axios.get(`https://viacep.com.br/ws/${zipCode}/json/`)
    if (data.erro) return false
    return true
  }

  async verifyTokenAccess(clientId, lastDigits, id) {
    try {
      console.log('Verificando token', clientId)
      const client = (await Client.query().where('id', clientId).first()).toJSON()
      const token = client.controls.asaas.cards.find((card) => card.creditCardNumber === lastDigits)

      console.time('Verificando token')
      const isValid = await Hash.verify(id, token.uuid)
      console.timeEnd('Verificando token')
      if (isValid) {
        return token
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async grovepayRetrieveOrder({ request, response }) {
    try {
      const { slug, orderId } = request.params
      const token = request.headers()
      gatewayGrovePay.setSecret(token.authorization)
      const pixInfo = await gatewayGrovePay.retrieveOrder({ order_id: orderId, slug: slug })
      return response.json(pixInfo.data)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async createFormPayment({ payment, externalReference, value, paymentType }) {
    const { tableId, commandId, cartId } = JSON.parse(externalReference)
    if (cartId) {
      const cart = await Cart.find(cartId)
      const profile = await cart.profile().fetch()
      const formPayment = profile.formsPayment.find((f) => f.payment === paymentType)
      cart.formsPayment.push({ ...formPayment, value, paymentId: payment.id, paid: false })
      await cart.save()
    }

    if (tableId) {
      const opened = await TableOpened.find(tableId)
      const table = await opened.table().fetch()
      const profile = await table.profile().fetch()
      const formPayment = profile.formsPayment.find((f) => f.payment === paymentType)
      opened.formsPayment.push({ ...formPayment, value, paymentId: payment.id, paid: false })
      await opened.save()
    }

    if (commandId) {
      const command = await Command.find(commandId)
      const opened = await command.opened().fetch()
      const table = await opened.table().fetch()
      const profile = await table.profile().fetch()
      const formPayment = profile.formsPayment.find((f) => f.payment === paymentType)
      command.formsPayment.push({ ...formPayment, value, paymentId: payment.id, paid: false })
      await command.save()
    }
  }
}

module.exports = GatewayController
