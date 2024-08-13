'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Request extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeSave', (request) => {
      if (!request.transshipment) {
        request.transshipment = 0
      }
      request.deliveryAddress = JSON.stringify(request.deliveryAddress)
      request.cart = JSON.stringify(request.cart)
      request.cartPizza = JSON.stringify(request.cartPizza)
      request.taxDelivery = !isNaN(parseFloat(request.taxDelivery)) ? parseFloat(request.taxDelivery) : null
    })

    this.addHook('afterUpdate', (request) => {
      request.deliveryAddress = JSON.parse(request.deliveryAddress)
      request.cart = JSON.parse(request.cart)
      request.cartPizza = JSON.parse(request.cartPizza)
    })

    this.addHook('afterFind', (request) => {
      request.deliveryAddress = JSON.parse(request.deliveryAddress)
      request.cart = JSON.parse(request.cart)
      request.cartPizza = JSON.parse(request.cartPizza)
    })

    this.addHook('afterCreate', (request) => {
      request.deliveryAddress = JSON.parse(request.deliveryAddress)
      request.cart = JSON.parse(request.cart)
      request.cartPizza = JSON.parse(request.cartPizza)
      request.taxDelivery = !isNaN(parseFloat(request.taxDelivery)) ? parseFloat(request.taxDelivery) : null
    })

    this.addHook('afterFetch', (requests) => {
      requests.forEach((request) => {
        request.deliveryAddress = JSON.parse(request.deliveryAddress)
        request.cart = JSON.parse(request.cart)
        request.cartPizza = JSON.parse(request.cartPizza)
      })
    })

    this.addHook('afterPaginate', (requests) => {
      requests.forEach((request) => {
        request.deliveryAddress = JSON.parse(request.deliveryAddress)
        request.cart = JSON.parse(request.cart)
        request.cartPizza = JSON.parse(request.cartPizza)
      })
    })
  }

  profile() {
    return this.belongsTo('App/Models/ReadOnly/Profile', 'profileId', 'id')
  }

  cupom() {
    return this.belongsTo('App/Models/ReadOnly/Cupom', 'cupomId', 'id')
  }

  command() {
    return this.belongsTo('App/Models/ReadOnly/Command', 'commandId', 'id')
  }

  bartender() {
    return this.belongsTo('App/Models/ReadOnly/Bartender', 'bartenderId', 'id')
  }

  fee() {
    return this.belongsToMany('App/Models/ReadOnly/Fee', 'requestId', 'feeId', 'id', 'id').pivotTable('request_fees')
  }
}

module.exports = Request
