'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvoicesSchema extends Schema {
  up() {
    this.table('invoices', (table) => {
      table.integer('installments').after('invoice_code')
      table.string('pdf', 2000).after('invoice_code')
    })
  }

  down() {
    this.table('invoices', (table) => {
      table.dropColumn('installments')
      table.dropColumn('pdf')
    })
  }
}

module.exports = InvoicesSchema
