'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BonusSupport extends Model {
  user() {
    return this.hasOne('App/Models/User', 'id', 'userId')
  }

  support() {
    return this.hasOne('App/Models/User', 'id', 'userId')
  }

  incvoice() {
    return this.hasOne('App/Models/SystemRequest', 'id', 'systemRequestId')
  }

}

module.exports = BonusSupport
