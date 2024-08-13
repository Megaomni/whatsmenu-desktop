'use strict'

const FlexPlan = use('App/Models/FlexPlan')

class FlexPlanController {
  async index({ response }) {
    const plans = await FlexPlan.all()
    return response.json(plans)
  }

  async getFlexPlans({ response }) {
    try {
      console.log('Starting: ', { controller: 'FlexPlanController', linha: 8, metodo: 'getFlexPlans' })
      const flex_plans = await FlexPlan.all()

      return response.json(flex_plans)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = FlexPlanController
