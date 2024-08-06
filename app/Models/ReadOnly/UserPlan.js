'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserPlan extends Model {
  static get connection() {
    return 'mysql_r'
  }
}

module.exports = UserPlan
