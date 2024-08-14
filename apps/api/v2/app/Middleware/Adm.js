'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/Auth')} Auth */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Adm {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Auth} ctx.auth
   * @param {Function} next
   */
  async handle({ request, auth, response }, next) {
    try {
      const user = await auth.getUser()
      if (!user.controls.type) {
        return response.status(403).json({
          errorMessage: 'Acesso proíbido para este usuário',
        })
      }
    } catch (error) {
      console.error(error)
    }
    await next()
  }
}

module.exports = Adm
