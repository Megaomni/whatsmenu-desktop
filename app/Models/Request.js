'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Request extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', (request) => {
      if (!request.transshipment) {
        request.transshipment = 0
      }
      request.deliveryAddress = JSON.stringify(request.deliveryAddress)
      request.cart = JSON.stringify(request.cart)
      request.cartPizza = JSON.stringify(request.cartPizza)
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
      request.taxDelivery = parseFloat(request.taxDelivery)
    })

    this.addHook('afterFetch', (requests) => {
      requests.forEach(request => {
        request.deliveryAddress = JSON.parse(request.deliveryAddress)
        request.cart = JSON.parse(request.cart)
        request.cartPizza = JSON.parse(request.cartPizza)
      })
    })
  }
}

module.exports = Request
