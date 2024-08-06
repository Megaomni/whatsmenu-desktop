'use strict'

const View = use('Adonis/Src/View')

const UserPlan = use("App/Models/UserPlan")
const FlexPlan = use("App/Models/FlexPlan")

class DeliveryPlan {
  async handle ({ response, auth }, next) {
    const user = await auth.getUser()

    const user_plans = await user.plans().where('category', 'basic').fetch()

    if (user_plans.rows.length > 0) {
      View.global('deliveryAccess', () => {
        return true
      })
      response.plainCookie('deliveryAccess', true)
    } else {
      View.global('deliveryAccess', () => {
      return false
      })
      response.plainCookie('deliveryAccess', false)
    }

    // call next to advance the request
    await next()
  }
}

module.exports = DeliveryPlan
