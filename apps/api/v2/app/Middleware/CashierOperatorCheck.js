'use strict'
const Bartender = use('App/Models/Bartender')
const Profile = use('App/Models/Profile')

class CashierOperatorCheck {
  async handle({ params, response }, next) {
    // call next to advance the request
    try {
      const { bartenderId, slug } = params
      const profile = await Profile.findBy('slug', slug)
      let bartender
      if (JSON.parse(bartenderId ? bartenderId : null)) {
        bartender = await Bartender.query().where('id', bartenderId).where('profileId', profile.id).first()
        if (!bartender) {
          return response.status(404).json({ message: 'Operador de caixa não encontrado' })
        } else if (bartender.controls.type !== 'cashier' && bartender.controls.type !== 'manager') {
          return response.status(403).json({ message: 'Operador não autorizado' })
        }
      } else {
        bartender = await Bartender.query().where('id', 'like', null).where('profileId', profile.id).first()
      }
      params.bartender = bartender
    } catch (error) {
      console.error(error)
      throw error
    }
    await next()
  }
}

module.exports = CashierOperatorCheck
