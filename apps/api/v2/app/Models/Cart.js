'use strict'

const { default: axios } = require('axios')
const Env = use('Env');

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Cart extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', async (cart) => {
      cart.formsPayment = cart.formsPayment ? JSON.stringify(cart.formsPayment) : '[]'
      cart.controls = cart.controls ? JSON.stringify(cart.controls) : '{}'
    })

    this.addHook('afterSave', async (cart) => {
      cart.formsPayment = JSON.parse(cart.formsPayment)
      cart.controls = JSON.parse(cart.controls)
    })

    this.addHook('afterFind', async (cart) => {
      cart.formsPayment = JSON.parse(cart.formsPayment)
      cart.controls = JSON.parse(cart.controls)
    })

    this.addHook('afterFetch', async (carts) => {
      carts.forEach((cart) => {
        cart.formsPayment = JSON.parse(cart.formsPayment)
        cart.controls = JSON.parse(cart.controls)
      })
    })

    this.addHook('afterPaginate', async (carts) => {
      carts.forEach((cart) => {
        cart.formsPayment = JSON.parse(cart.formsPayment)
        cart.controls = JSON.parse(cart.controls)
      })
    })

    this.addHook('beforePaginate', async (carts) => {
      carts.whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
    })

    this.addHook('beforeFetch', async (carts) => {
      carts.whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
    })

    this.addHook('beforeFind', async (carts) => {
      carts.whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
    })
  }

  client() {
    return this.belongsTo('App/Models/Client', 'clientId', 'id')
  }

  bartender() {
    return this.belongsTo('App/Models/Bartender', 'bartenderId', 'id')
  }

  cashier() {
    return this.belongsTo('App/Models/Cashier', 'cashierId', 'id')
  }

  profile() {
    return this.belongsTo('App/Models/Profile', 'profileId', 'id')
  }

  address() {
    return this.belongsTo('App/Models/ClientAddress', 'addressId', 'id')
  }

  itens() {
    return this.hasMany('App/Models/CartIten', 'id', 'cartId')
  }

  cupom() {
    return this.belongsTo('App/Models/Cupom', 'cupomId', 'id')
  }

  command() {
    return this.belongsTo('App/Models/Command', 'commandId', 'id')
  }

  motoboy() {
    return this.belongsTo('App/Models/Motoboy', 'motoboyId', 'id')
  }
}

module.exports = Cart
