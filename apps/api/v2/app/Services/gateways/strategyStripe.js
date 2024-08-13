'use strict'

const Gateway = require('./strategy/gateway')
const stripe = require('../../../stripe')
const { DateTime } = require('luxon')
const User = use('App/Models/User')
const Invoice = use('App/Models/Invoice')
const SystemProduct = use('App/Models/SystemProduct')
const SystemRequest = use('App/Models/SystemRequest')

class StrategyStripe {
  constructor() {
    this.stripe = stripe
  }

  async addSubscriptionDiscount(data) {
    const discount = await this.stripe.customers.createBalanceTransaction(data.customerId, {
      amount: data.value,
      currency: data.currency,
      description: data.description,
      metadata: data.metadata,
    })

    return discount
  }

  async addSubscriptionIncrement(data) {
    const increment = await this.stripe.customers.createBalanceTransaction(data.customerId, {
      amount: Math.abs(data.value),
      currency: data.currency,
      description: data.description,
      metadata: data.metadata,
    })

    return increment
  }

  async addSubscriptionItem(data) {
    const subscriptionItem = await this.stripe.subscriptionItems.create({
      subscription: data.subscriptionId,
      price: data.priceId,
      quantity: data.quantity,
      metadata: data.metadata,
    })

    return subscriptionItem
  }

  async createCard(data) {
    const card = await this.stripe.customers.createSource(data.customerId, {
      source: data.token,
    })

    console.log(card)

    return card
  }

  async createCustomer(data) {
    const customer = await this.stripe.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      metadata: data.metadata,
    })

    return customer
  }

  async createCheckoutOrPurchaseCard(data) {
    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer: data.customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      currency: data.currency,
      line_items: data.line_items,
      mode: data.mode,
      success_url: data.success_url,
      cancel_url: data.cancel_url,
      metadata: data.metadata,
    })

    return checkoutSession
  }

  async createSubscription(data) {
    const subscription = await this.stripe.subscriptions.create({
      customer: data.customerId,
      items: data.items,
      metadata: data.metadata,
      collection_method: 'charge_automatically',
      default_source: data.cardId,
      currency: data.currency,
    })

    return subscription
  }

  async createCardToken(data) {
    const token = await this.stripe.tokens.create({
      card: {
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        number: data.number,
        currency: data.currency,
        cvc: data.cvc,
        name: data.name,
      },
    })

    return token
  }

  async deleteCard(data) {
    const deletedCard = await this.stripe.customers.deleteSource(data.customerId, data.cardId)

    return deletedCard
  }

  async cancelSubscription(subscriptionId, data) {
    const canceledSubscription = await this.stripe.subscriptions.cancel(subscriptionId)
    return canceledSubscription
  }

  async deleteSubscriptionItem(data, subscriptionItemId) {
    if (data.userId) {
      const invoice = await Invoice.query().where({ userId: data.userId, status: 'paid', type: 'monthly' }).first()
      if (invoice) {
        const request = await invoice.firstRequest(invoice.id)
        if (request) {
          const product = await SystemProduct.findBy({ [data.key]: data.value })
          if (product) {
            const price = product.prices.find((pr) => pr.id === data.price.id)
            if (price) {
              const item = request.lines.data.find((item) => item.price.id === price.gateway.stripe.id)
              if (item) {
                const deletedItem = await this.stripe.subscriptionItems.del(subscriptionItemId)
                return deletedItem
              }
            }
          }
        }
      }
    }

    return
  }

  async updateChargeOrSubscriptionCard(data) {
    if (data.subscriptionId) {
      return await this.stripe.subscriptions.update(data.subscriptionId, {
        default_source: data.cardId,
      })
    }

    throw {
      status: 403,
      message: 'Change charge card, not avaible in stripe gateway',
    }
  }

  //WEBHOOKS
  async webhookChargePaid(event) {
    return await stripe.invoices.update(data.invoice, {
      metadata: data.metadata,
    })
  }

  async webhookDeletedCard(event) {
    const data = event.data.object
    const user = await User.query().where('controls', 'LIKE', `%${data.customer}%`).first()

    if (user) {
      user.controls.paymentInfo.cards = user.controls.paymentInfo.cards.filter((card) => card.id !== data.id)
      await user.save()

      return user.toJSON()
    }
  }

  async webhookUpdatedCard(event) {
    const data = event.data.object
    const user = await User.query().where('controls', 'like', `%${data.costumer}%`).first()

    if (user.controls.paymentInfo.cards) {
      const card = user.controls.paymentInfo.cards.find((card) => card.id === data.id)

      if (card) {
        card.exp_month = data.exp_month
        card.exp_year = data.exp_year
      }

      await user.save()
    }
  }

  async webhookCanceledInvoice(event) {
    const data = event.data.object
    const user = await User.findBy('email', data.customer_email)

    const invoice = await user.invoices().where('invoice_code', data.id).last()

    if (invoice) {
      invoice.status = 'canceled'
      await this.__createSystemRequest(invoice, data, 'canceled')
      await invoice.save()
    }
  }

  async webhookCardCreated(event) {
    console.log('aqui')
    const data = event.data.object
    const user = await User.query().where('controls', 'LIKE', `%${data.customer}%`).first()
    if (user && data.object === 'card') {
      const cards = user.controls.paymentInfo.cards
      const newCard = {
        id: data.id,
        type: data.funding,
        brand: data.brand,
        status: 'active',
        expYear: data.exp_year,
        expMonth: data.exp_month,
        holderName: data.name,
        lastDigits: data.last4,
        firstDigits: '*****',
      }
      if (cards) {
        if (!cards.some((card) => card.id === newCard.id)) {
          cards.push(newCard)
        }
      } else {
        user.controls.paymentInfo.cards = [newCard]
      }

      await user.save()
    }
  }

  async webhookInvoiceCreated(event) {
    const data = event.data.object
    const user = await User.findBy('email', data.customer_email)
    try {
      if (user) {
        switch (data.billing_reason) {
          case 'upcoming':
          case 'subscription_cycle':
            try {
              const expiration = DateTime.fromSeconds(data.period_start).toFormat('yyyy-MM-dd')
              console.log(expiration)
              const upcomingInvoice = await user.invoices().where({ status: 'upcoming', expiration }).last()

              if (upcomingInvoice) {
                upcomingInvoice.invoice_code = data.id
                upcomingInvoice.status = data.paid ? 'paid' : 'pending'

                await upcomingInvoice.save()
                await this.__createSystemRequest(upcomingInvoice, data)
              } else {
                let invoiceExists
                if (data.billing_reason !== 'upcoming') {
                  invoiceExists = await user.invoices().where('invoice_code', data.id).last()
                }

                if (!invoiceExists) {
                  const dataStatus = data.billing_reason === 'upcoming' ? 'upcoming' : data.paid ? 'paid' : 'pending'
                  const items = await this.__getItems(data.lines.data)
                  const invoice = await this.__generateInvoice(data.id, data, items, user.id, dataStatus)

                  if (data.paid) {
                    await this.__createSystemRequest(invoice, data, invoice.status)
                  }
                }
              }
            } catch (error) {
              console.error(error)
            }
            break
          case 'subscription_create':
            const firstInvoice = await user.invoices().where({ type: 'first' }).first()

            if (firstInvoice) {
              if (firstInvoice.status === 'pending') {
                firstInvoice.invoice_code = data.id
                await firstInvoice.save()
              } else {
                const items = await this.__getItems(data.lines.data)
                console.log('subscription_create', data)
                await this.__generateInvoice(data.id, data, items, user.id)
              }
            }
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async webhookUpdatedInvoice(event) {
    return await this.webhookInvoiceCreated(event)
  }

  async webhookInvoicePaid(event) {
    const data = event.data.object
    const user = await User.findBy('email', data.customer_email)
    const invoice = await user.invoices().where('invoice_code', data.id).last()

    if (invoice && data.paid && data.status === 'paid') {
      invoice.status = 'paid'
      await this.__createSystemRequest(invoice, data, 'paid')
      await invoice.save()
    }
  }

  async webhookFailedInvoicePayment(event) {
    const data = event.data.object
    const user = await User.findBy('email', data.customer_email)
    const invoice = await user.invoices().where('invoice_code', data.id).last()

    if (invoice) {
      invoice.status = 'pending'
      await this.__createSystemRequest(invoice, data, 'failed')
      await invoice.save()
    }
  }

  async webhookSubscriptionCanceled(event) {
    const data = event.data.object
    console.log(data)
    const user = await User.query().where('controls', 'LIKE', `%${data.customer}%`).first()

    if (user) {
      const profile = await user.profile().fetch()
      if (profile) {
        profile.status = 0
        await profile.save()
      }

      user.controls.paymentInfo.subscription.status = 'canceled'

      await user.save()
    }

    return user
  }

  async webhookSubscriptionCreated(event) {
    const data = event.data.object
    const user = await User.query().where('controls', 'LIKE', `%${data.customer}%`).first()

    if (user) {
      console.log('achou user')
      user.controls.paymentInfo = {
        ...user.controls.paymentInfo,
        subscription: {
          id: data.id,
          status: 'active',
        },
      }

      await user.save()
    }
  }

  async __createSystemRequest(systemInvoice, data, status = 'pending') {
    try {
      return await SystemRequest.create({
        invoiceId: systemInvoice.id,
        transactionId: data.charge,
        expiration: systemInvoice.expiration,
        status: status ? status : systemInvoice.status,
        type: systemInvoice.type[0] === 'a' ? 'A' : 'M',
        userId: systemInvoice.userId,
        planId: 1,
        paghiper: [data],
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async __getItems(line_items) {
    return line_items
      .filter((item) => {
        if (item.plan) {
          return item.type === 'subscription'
        } else {
          return item.price.type === 'one_time'
        }
      })
      .map((item) => {
        const price = item.price
        const itemInvoice = {
          id: price.metadata.id,
          name: price.metadata.name,
          service: price.metadata.service,
          price_id: price.metadata.priceId,
          plan_id: price.metadata.planId,
          value: price.unit_amount / 100,
          quantity: item.quantity,
        }

        if (price.metadata.category) {
          itemInvoice.category = price.metadata.category
        }
        return itemInvoice
      })
  }

  async __generateInvoice(invoiceCode, transaction, items, userId, status = 'pending') {
    try {
      return await Invoice.create({
        userId: userId,
        invoice_code: invoiceCode,
        pdf: transaction.pdf ? transaction.pdf : null,
        status: status,
        type: 'monthly',
        expiration: DateTime.fromSeconds(transaction.period_start).toFormat('yyyy-MM-dd'),
        value: transaction.total / 100,
        itens: items,
      })
    } catch (error) {
      console.error(error)
    }
  }
}

const gatewayStripe = new Gateway(new StrategyStripe())

module.exports = gatewayStripe
