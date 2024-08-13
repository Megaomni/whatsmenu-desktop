'use strict'

const Profile = use("App/Models/Profile")
const User = use("App/Models/User")

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class TableApi {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, params, response }, next) {
    const profile = await Profile.find(params.profileId)
    const user = await User.find(profile.userId)
    const user_plans = await user.plans().where('category', 'table').fetch()

    if (!user_plans.rows.length) {
      return response.status(406).json({ message: "Esse perfil não inclui o plano de mesas, entre em contato com suporte para solicitar a adesão do plano de mesas" })
    }

    await next()
  }
}

module.exports = TableApi
