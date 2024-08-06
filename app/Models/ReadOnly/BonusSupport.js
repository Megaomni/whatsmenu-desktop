'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BonusSupport extends Model {
  static get connection() {
    return 'mysql_r'
  }

  user() {
    return this.hasOne('App/Models/ReadOnly/User', 'id', 'userId')
  }

  support() {
    return this.hasOne('App/Models/ReadOnly/User', 'id', 'userId')
  }

  incvoice() {
    return this.hasOne('App/Models/ReadOnly/SystemRequest', 'id', 'systemRequestId')
  }

}

module.exports = BonusSupport
