'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PizzaInventoryAlertSchema extends Schema {
  up () {
    this.table('pizza_products', (table) => {
      table.integer('amount').nullable().after('implementations').defaultTo(0)
      table.boolean('bypass_amount').nullable().after('implementations').defaultTo(true)
      table.integer('amount_alert').nullable().after('implementations').defaultTo(0)
      
    })
  }

  down () {
    this.table('pizza_products', (table) => {
      table.dropColumn('amount_alert')
      table.dropColumn('bypass_amount')
      table.dropColumn('amount')
    })
  }
}

module.exports = PizzaInventoryAlertSchema
