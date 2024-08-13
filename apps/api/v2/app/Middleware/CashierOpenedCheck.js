'use strict'
const Cashier = use('App/Models/Cashier')
const Profile = use('App/Models/Profile')

class CashierOpenedCheck {

  async handle({ params, request, response }, next) {
    const { slug, bartenderId } = params
    const { cashierId } = request.all()

    try {
      const profile = await Profile.findBy('slug', slug)
      const cashier = await Cashier.query().where({
        closed_at: null,
        bartenderId: bartenderId,
        profileId: profile.id,
      })
      .where((query) => {
        if (cashierId) {
          return query.where({ id: cashierId })
        }
        return query
      })
      .first()
      if (!cashier) {
        return response.status(404).json({ message: 'Nenhum caixa aberto' })
      }
    } catch (error) {
      console.error(error);
      throw error
    }
    await next()
  }
}

module.exports = CashierOpenedCheck
