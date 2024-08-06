'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User')
const Hash = use('Hash')
const Env = use('Env')

class SecurityKey {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response, auth, view, session }, next) {
    try {
      const user = await User.find(auth.user.id)
      const { security_key, notValidate } = request.all()
      if (notValidate) {
        return await next()
      }
      let isSame = await Hash.verify(security_key, user.security_key)
      if (!isSame) {
        return response.status(403).json({ message: "Senha de segurança inválida!", code: '403-s', data: { url: '', body: request.all() } })
      }
      return await next()
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = SecurityKey
