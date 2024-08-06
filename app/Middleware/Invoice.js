'use strict'
const View = use('Adonis/Src/View')
const PaymentController = use('App/Controllers/Http/PaymentController')
const moment = use('moment')
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Auth')} Auth */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Invoice {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Auth} ctx.auth
   * @param {Function} next
   */
  async handle ({ request, response, auth }, next) {
    try {
      const user = await auth.getUser()
      let sr = await user.requests().last()

      if (sr) {
        sr = sr.toJSON()
      }

      if (sr && sr.status === 'canceled' && !user.controls.disableInvoice) {
        if (Array.isArray(sr.paghiper)) {
          sr = await PaymentController.createNewInvoiceToUser(user.id, sr.paghiper[0].create_request.value_cents)
        } else {
          sr = await PaymentController.createNewInvoiceToUser(user.id, sr.paghiper.create_request.value_cents)
        }
      }

      View.global('getLastInvoice', () => {
        if (!user.controls.disableInvoice && sr && sr.userId === user.id && (sr.status !== 'paid' && sr.status !== 'completed' && sr.status !== 'reserved')) {
          if (Array.isArray(sr.paghiper)) {
            sr.paghiper = sr.paghiper[0]
          }

          if (moment().format() >= moment(sr.paghiper.create_request.due_date).format()) {
            sr.overdue = true
          }

          return sr

        }

        return null
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        user: auth.user.id,
        error: error
      })
      response.status(500)
      response.send(error)
    }

    await next()
  }
}

module.exports = Invoice
