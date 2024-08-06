'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CartsSchema extends Schema {
  up () {
    this.table('carts', (table) => {
      table.enum('statusPayment',['offline', 'paid', 'pending', 'cancelled']).nullable().defaultTo(null).after('status')
    })
  }

  down () {
    this.table('carts', (table) => {
      table.dropColumn('statusPayment')
    })
  }
}

module.exports = CartsSchema
