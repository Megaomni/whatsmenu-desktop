'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const User = use('App/Models/User')

const View = use('Adonis/Src/View')
const Env = use('Adonis/Src/Env')
// const moment = use('moment')

class Auth {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Auth} ctx.auth
   * @param {Response} ctx.response
   * @param {Function} next
   */
  async handle({ request, auth, response, session }, next) {
    // call next to advance the request
    try {
      await auth.check()
      const user = await User.find(auth.user.id);
      if (user.controls.forceSecurity) {
        return response.status(403).json({ message: `Sua senha não é alterada há alguns meses, por motivo de segurança, crie uma nova senha clicando no link enviado para o email ${user.email}`, title: "Sua senha do painel expirou", code: '403-F' })
      }
      if (user.controls.attempts < 5) {
        const profile = await user.profile().fetch()

        if (!profile && !user.controls.type && request.url() !== '/dashboard/profile/register') {
          response.route('profileRegister')
        }
        await next()
      } else {
        return response.status(403).json({ message: "Limite de tentativas de login excedido!", code: '403-B' })
      }
    } catch (error) {
      if (Env.get('NODE_ENV') === 'development') {
        throw error
      }
      throw error
    }
  }
}

module.exports = Auth
