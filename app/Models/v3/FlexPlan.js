'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlexPlan extends Model {
  static get connection() {
    return 'mysql_v3'
  }
  
  users() {
    return this.belongsToMany('App/Models/v3/Product', 'flexPlanId', 'userId', 'id', 'id').pivotTable('user_plans')
  }
}

module.exports = FlexPlan
