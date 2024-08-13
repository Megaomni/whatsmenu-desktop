'use strict'

const { DateTime } = require('luxon')

const Cashier = use('App/Models/Cashier')
const CashierR = use('App/Models/ReadOnly/Cashier')
const Cart = use('App/Models/Cart')
const Profile = use('App/Models/Profile')
const ProfileR = use('App/Models/ReadOnly/Profile')
const Bartender = use('App/Models/Bartender')
const Database = use('Database')
const moment = use('moment')

class CashierController {
  async store({ params, request, response }) {
    let { bartender, profile } = params

    try {
      const { initialValue } = request.except(['_csrf', '_method'])
      let alreadyOpenedCashier

      if (bartender) {
        let cashiers = await bartender.cashiers().fetch()
        cashiers = cashiers.toJSON()

        alreadyOpenedCashier = cashiers.find((cashier) => cashier.closed_at === null)
      } else {
        bartender = await Bartender.query()
          .where({ profileId: profile.id })
          .whereRaw(`JSON_CONTAINS(controls, '{ "defaultCashier": true }')`)
          .with('activeCashier')
          .first()
      }

      if (!profile.options.pdv.cashierManagement) {
        alreadyOpenedCashier = await Cashier.query()
          .where({
            profileId: profile.id,
            bartenderId: bartender.id,
            closed_at: null,
          })
          .first()
      } else {
        alreadyOpenedCashier = !!bartender.toJSON().activeCashier
      }

      if (alreadyOpenedCashier) {
        return response
          .status(403)
          .json({ message: 'Já existe um caixa aberto no momento, finalize para poder abrir um novo caixa', cashier: alreadyOpenedCashier })
      }

      const newCashier = await Cashier.create({
        profileId: profile.id,
        bartenderId: bartender ? bartender.id : null,
        initialValue: initialValue ? initialValue : 0,
        closed_at: null,
      })

      if (profile.options.package.cashierDate === 'deliveryDate') {
        const carts = await Cart.query()
          .whereBetween('packageDate', [DateTime.local().toFormat('yyyy-MM-dd'), DateTime.local().plus({days: 1}).toFormat('yyyy-MM-dd')])
          .where('type', 'P')
          .where({
            profileId: profile.id,
            cashierId: null,
          })
          .fetch()

        for await (const cart of carts.rows) {
          cart.cashierId = newCashier.id
          await cart.save()
        }
      }

      if (bartender) {
        if (!bartender.controls.defaultCashier && !profile.options.pdv.cashierManagement) {
          return response.status(400).json({ message: 'Não existe um caixa padrão' })
        }
        const cartsWithoutCashier = await Cart.query()
          .where({
            profileId: profile.id,
            cashierId: null,
          })
          .whereBetween('created_at', [DateTime.local().toFormat('yyyy-MM-dd'), DateTime.local().plus({days: 1}).toFormat('yyyy-MM-dd')])
          .where('type', 'D')
          .fetch()
        for (const cart of cartsWithoutCashier.rows) {
          cart.cashierId = newCashier.id
          await cart.save()
        }

        if (profile.options.package.cashierDate === 'deliveryDate') {
          const carts = await Cart.query()
            .where({
              profileId: profile.id,
              cashierId: null,
            })
            .whereBetween('packageDate', [DateTime.local().toFormat('yyyy-MM-dd'), DateTime.local().plus({days: 1}).toFormat('yyyy-MM-dd')])
            .where('type', 'P')
            .fetch()

          for await (const cart of carts.rows) {
            cart.cashierId = newCashier.id
            await cart.save()
          }
        }
      }

      newCashier.carts = await newCashier.carts().fetch()

      return response.status(201).json({ cashier: newCashier })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async close({ params, request, response }) {
    const { slug, bartenderId } = params
    const { cashierId } = request.all()

    try {
      const { closedValues } = request.except(['_csrf', '_method'])
      const profile = await Profile.findBy('slug', slug)

      const cashier = await Cashier.query()
        .where({
          id: cashierId ? cashierId : null,
          closed_at: null,
          bartenderId: bartenderId ? JSON.parse(bartenderId) : null,
          profileId: profile.id,
        })
        .with('carts')
        .first()

      cashier.closed_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')

      cashier.closedValues_user = closedValues
      cashier.closedValues_system = await this.generateClosedValues(cashier, profile)

      await cashier.save()

      return response.json({ cashier })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async addTransaction({ params, request, response }) {
    try {
      const { slug, bartenderId } = params
      const { transaction, cashierId } = request.except(['_csrf', '_method'])

      const profile = await Profile.findBy('slug', slug)
      const cashier = await Cashier.query()
        .where({
          id: cashierId,
          bartenderId: bartenderId ? bartenderId : null,
          closed_at: null,
        })
        .with('carts')
        .first()

      transaction.value = transaction.type === 'income' ? transaction.value || 0 : (transaction.value || 0) * -1
      transaction.created_at = DateTime.local().setZone(profile.timeZone).toFormat('yyyy-MM-dd HH:mm:ss')

      cashier.transactions.push(transaction)

      await cashier.save()

      return response.json({ cashier })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async list({ params }) {
    try {
      const { slug } = params
      const profile = await ProfileR.query().where({ slug: slug }).first()
      const alreadyOpenedCashier = await CashierR.query().where({ profileId: profile.id, closed_at: null }).first()
      return !!alreadyOpenedCashier
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async closedValuesSystemReport({ request, response }) {
    try {
      const { cashierId, profileId, save } = request.all()
      const cashier = await Cashier.find(cashierId)
      const profile = await Profile.find(profileId)

      const closedValues = await this.generateClosedValues(cashier, profile)

      if (save) {
        cashier.closedValues_system = closedValues
        await cashier.save()
      }

      return response.json({ closedValues })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async generateClosedValues(cashier, profile) {
    const closedDate = (cashier.closed_at ? DateTime.fromJSDate(new Date(cashier.closed_at)) : DateTime.local()).toFormat('"yyyy-MM-dd HH:mm:ss"')
    try {
      const closedValues_system = await Database.raw(
        `
        SELECT sum(value) as total, payment, flag, created_at, profileId, status
        FROM carts,
          JSON_TABLE(
            formsPayment,
            '$[*]' COLUMNS(
                    value FLOAT PATH '$.value',
                    payment VARCHAR(20) PATH '$.payment',
                    flag VARCHAR(20) PATH '$.flag.name'
                  )
          ) AS paymentSummary WHERE created_at BETWEEN ${DateTime.fromJSDate(cashier.created_at).toFormat(
            '"yyyy-MM-dd HH:mm:ss"'
          )} AND ${closedDate} AND profileId = ${
          profile.id
        } AND (status <> "canceled" OR status IS NULL)  GROUP BY total, payment, flag, created_at, profileId, status;
      `
      ).on('query', console.log)
      const formsPayment = profile.formsPayment.filter((formsPayment) => formsPayment.status)

      const cashierClosedSystemValues = formsPayment.reduce((acc, { payment, label, flags }) => {
        const baseClosedValue = { payment, label, total: 0 }
        if (flags && flags.length) {
          flags.forEach((flag) => {
            acc.push({
              ...baseClosedValue,
              flag: flag.name,
              total: closedValues_system[0].reduce(
                (total, closedSystemValue) =>
                  (total += closedSystemValue.payment === payment && closedSystemValue.flag === flag.name ? closedSystemValue.total : 0),
                0
              ),
            })
          })
        } else {
          acc.push({
            ...baseClosedValue,
            flag: null,
            total: closedValues_system[0].reduce(
              (total, closedSystemValue) => (total += closedSystemValue.payment === payment ? closedSystemValue.total : 0),
              0
            ),
          })
        }
        return acc
      }, [])

      return cashierClosedSystemValues
    } catch (error) {
      throw error
    }
  }
}

module.exports = CashierController
