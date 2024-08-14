'use strict'

const View = use('Adonis/Src/View')

const UserPlan = use('App/Models/UserPlan')
const FlexPlan = use('App/Models/FlexPlan')

class SchedulePlan {
  async handle({ response, auth }, next) {
    const user = await auth.getUser()
    const user_plans = await user.plans().where('category', 'package').fetch()

    if (user_plans.rows.length > 0) {
      View.global('scheduleAccess', () => {
        return true
      })
      response.plainCookie('scheduleAccess', true)
    } else {
      View.global('scheduleAccess', () => {
        return false
      })
      response.plainCookie('scheduleAccess', false)
    }

    // call next to advance the request
    await next()
  }
}

module.exports = SchedulePlan
