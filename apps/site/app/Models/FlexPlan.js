'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlexPlan extends Model {
  users() {
    return this.belongsToMany('App/Models/Product', 'flexPlanId', 'userId', 'id', 'id').pivotTable('user_plans')
  }
}

module.exports = FlexPlan
