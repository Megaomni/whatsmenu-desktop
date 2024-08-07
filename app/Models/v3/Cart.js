'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Cart extends Model {
  static get connection() {
    return 'mysql_v3'
  }
  
  static boot() {
    super.boot();

    this.addHook("beforeSave", async (cart) => {
      cart.formsPayment = cart.formsPayment ? JSON.stringify(cart.formsPayment) : '[]'
      cart.controls = cart.controls ? JSON.stringify(cart.controls) : '{}'
    })

    this.addHook("afterSave", async (cart) => {
      cart.formsPayment = JSON.parse(cart.formsPayment)
      cart.controls = JSON.parse(cart.controls)
    })

    this.addHook("afterFind", async (cart) => {
      cart.formsPayment = JSON.parse(cart.formsPayment)
      cart.controls = JSON.parse(cart.controls)
    })

    this.addHook("afterFetch", async (carts) => {
      carts.forEach(cart => {
        cart.formsPayment = JSON.parse(cart.formsPayment)
        cart.controls = JSON.parse(cart.controls)
      });
    })

    this.addHook("afterPaginate", async (carts) => {
      carts.forEach(cart => {
        cart.formsPayment = JSON.parse(cart.formsPayment)
        cart.controls = JSON.parse(cart.controls)
      });
    })
  }

  client() {
    return this.belongsTo('App/Models/v3/Client', 'clientId', 'id')
  }

  bartender() {
    return this.belongsTo('App/Models/v3/Bartender', 'bartenderId', 'id')
  }

  cashier() {
    return this.belongsTo('App/Models/v3/Cashier', 'cashierId', 'id')
  }

  profile() {
    return this.belongsTo('App/Models/v3/Profile', 'profileId', 'id')
  }

  address() {
    return this.belongsTo('App/Models/v3/ClientAddress', 'addressId', 'id')
  }

  itens() {
    return this.hasMany('App/Models/v3/CartIten', 'id', 'cartId')
  }

  cupom() {
    return this.belongsTo('App/Models/v3/Cupom', 'cupomId', 'id')
  }

  command() {
    return this.belongsTo('App/Models/v3/Command', 'commandId', 'id')
  }
}

module.exports = Cart
