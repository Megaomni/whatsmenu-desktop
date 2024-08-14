'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Seller extends Model {
  users() {
    return this.hasMany('App/Models/User', 'id', 'sellerId')
  }
}

module.exports = Seller
