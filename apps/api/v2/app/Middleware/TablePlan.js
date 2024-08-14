'use strict'

const View = use('Adonis/Src/View')

const UserPlan = use('App/Models/UserPlan')
const FlexPlan = use('App/Models/FlexPlan')

class TablePlan {
  async handle({ response, auth }, next) {
    const user = await auth.getUser()
    const user_plans = await user.plans().where('category', 'table').fetch()

    if (user_plans.rows.length > 0) {
      View.global('tableAccess', () => {
        return true
      })
      response.plainCookie('tableAccess', true)
    } else {
      View.global('tableAccess', () => {
        return false
      })
      response.plainCookie('tableAccess', false)
    }

    // call next to advance the request
    await next()
  }
}

module.exports = TablePlan
