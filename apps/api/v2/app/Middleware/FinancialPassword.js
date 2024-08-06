'use strict'

const Hash = use('Hash')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class FinancialPassword {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response, auth }, next) {
    const password = request.input('password')
    const user = await auth.getUser()
    const isSame = await Hash.verify(password, user.security_key)
    if (isSame) {
      await next()
    } else {
      return response.status(403).json({message:'Senha financeira inválida'})
    }

  }
}

module.exports = FinancialPassword
