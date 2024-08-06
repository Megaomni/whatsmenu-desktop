'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Seller extends Model {
  static get connection() {
    return 'mysql_r'
  }

  users () {
    return this.hasMany('App/Models/ReadOnly/User', 'id', 'sellerId')
  }
}

module.exports = Seller
