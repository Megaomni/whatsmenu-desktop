'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PizzaProductsSchema extends Schema {
  up () {
    this.table('pizza_products', (table) => {
      // alter table
      table.json('disponibility').after('implementations')
    })
  }

  down () {
    this.table('pizza_products', (table) => {
      // reverse alternations
      table.dropColumn('disponibility')
    })
  }
}

module.exports = PizzaProductsSchema
