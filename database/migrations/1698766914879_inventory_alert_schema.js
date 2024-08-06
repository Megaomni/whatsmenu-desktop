'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InventoryAlertSchema extends Schema {
  up () {
    this.table('products', (table) => {
      table.integer('amount').nullable().after('description').defaultTo(0)
      table.integer('amount_alert').nullable().after('description').defaultTo(0)
      table.boolean('bypass_amount').nullable().after('description').defaultTo(true)
    })
  }

  down () {
    this.table('products', (table) => {
      table.dropColumn('amount')
      table.dropColumn('amount_alert')
      table.dropColumn('bypass_amount')
    })
  }
}

module.exports = InventoryAlertSchema
