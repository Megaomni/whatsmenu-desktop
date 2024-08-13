'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CartsSchema extends Schema {
  up () {
    this.table('carts', (table) => {
      table.integer('motoboyId').nullable().unsigned().references('id').inTable('motoboys').after('cashierId')
    })
  }

  down() {
    this.table('carts', (table) => {
      table.dropForeign('motoboyId', 'carts_motoboyid_foreign');
      table.dropColumn('motoboyId')
    })
  }
}

module.exports = CartsSchema
