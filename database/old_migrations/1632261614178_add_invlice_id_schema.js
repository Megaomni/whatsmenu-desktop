'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddInvliceIdSchema extends Schema {
  up () {
    this.table('system_requests', (table) => {
      table.integer('invoiceId').unsigned().references('id').inTable('invoices').after('id')
    })
  }

  down () {
    this.table('system_requests', (table) => {
      table.dropForeign('invoiceId')
      table.dropColumn('invoiceId')
    })
  }
}

module.exports = AddInvliceIdSchema
