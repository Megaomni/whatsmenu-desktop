'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Cashier extends Model {
  static boot() {
    super.boot();

    this.addHook("beforeCreate", async (cashier) => {
      cashier.transactions = []
      cashier.controls = {}
    })

    this.addHook("beforeSave", async (cashier) => {
      cashier.closedValues_user = JSON.stringify(cashier.closedValues_user)
      cashier.closedValues_system = JSON.stringify(cashier.closedValues_system)
      cashier.transactions = JSON.stringify(cashier.transactions)
      cashier.controls = JSON.stringify(cashier.controls)
    })

    this.addHook("afterSave", async (cashier) => {
      cashier.closedValues_user = cashier.closedValues_user ? JSON.parse(cashier.closedValues_user) : null
      cashier.closedValues_system = cashier.closedValues_system ? JSON.parse(cashier.closedValues_system) : null
      cashier.transactions = JSON.parse(cashier.transactions)
      cashier.controls = JSON.parse(cashier.controls)
    })

    this.addHook("afterFind", async (cashier) => {
      cashier.closedValues_user = JSON.parse(cashier.closedValues_user)
      cashier.closedValues_system = JSON.parse(cashier.closedValues_system)
      cashier.transactions = JSON.parse(cashier.transactions)
      cashier.controls = JSON.parse(cashier.controls)
    })

    this.addHook("afterFetch", async (cashiers) => {
      cashiers.forEach(cashier => {
        cashier.closedValues_user = JSON.parse(cashier.closedValues_user)
        cashier.closedValues_system = JSON.parse(cashier.closedValues_system)
        cashier.transactions = JSON.parse(cashier.transactions)
        cashier.controls = JSON.parse(cashier.controls)
      });
    })

    this.addHook("afterPaginate", async (cashiers) => {
      cashiers.forEach(cashier => {
        cashier.closedValues_user = JSON.parse(cashier.closedValues_user)
        cashier.closedValues_system = JSON.parse(cashier.closedValues_system)
        cashier.transactions = JSON.parse(cashier.transactions)
        cashier.controls = JSON.parse(cashier.controls)
      });
    })
  }

  carts() {
    return this.hasMany('App/Models/Cart', 'id', 'cashierId').whereNot('type', 'T').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }

  allCarts() {
    return this.hasMany('App/Models/Cart', 'id', 'cashierId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }

  openeds() {
    return this.hasMany('App/Models/TableOpened', 'id', 'cashierId').where('status', 0)
  }
}

module.exports = Cashier
