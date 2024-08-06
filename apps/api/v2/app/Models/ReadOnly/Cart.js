'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Cart extends Model {
  static get connection() {
    return 'mysql_r'
  }

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
    return this.belongsTo('App/Models/ReadOnly/Client', 'clientId', 'id')
  }

  bartender() {
    return this.belongsTo('App/Models/ReadOnly/Bartender', 'bartenderId', 'id')
  }

  cashier() {
    return this.belongsTo('App/Models/ReadOnly/Cashier', 'cashierId', 'id')
  }

  profile() {
    return this.belongsTo('App/Models/ReadOnly/Profile', 'profileId', 'id')
  }

  address() {
    return this.belongsTo('App/Models/ReadOnly/ClientAddress', 'addressId', 'id')
  }

  itens() {
    return this.hasMany('App/Models/ReadOnly/CartIten', 'id', 'cartId')
  }

  cupom() {
    return this.belongsTo('App/Models/ReadOnly/Cupom', 'cupomId', 'id')
  }

  command() {
    return this.belongsTo('App/Models/ReadOnly/Command', 'commandId', 'id')
  }

  motoboy() {
    return this.belongsTo('App/Models/ReadOnly/Motoboy', 'motoboyId', 'id')
  }
}

module.exports = Cart
