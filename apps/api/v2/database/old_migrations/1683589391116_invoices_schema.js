'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvoicesSchema extends Schema {
  up() {
    this.table('invoices', (table) => {
      table.string('invoice_code').after('userId')
    })
  }

  down() {
    this.table('invoices', (table) => {
      table.dropColumn('invoice_code')
    })
  }
}

module.exports = InvoicesSchema
