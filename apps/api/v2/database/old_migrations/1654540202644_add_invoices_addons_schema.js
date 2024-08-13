'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddInvoicesAddonsSchema extends Schema {
  up() {
    this.table('invoices', (table) => {
      table.enu('type', ['first', 'monthly', 'upgrade', 'addon']).alter()
    })
  }

  down() {
    this.table('invoices', (table) => {
      table.enu('type', ['first', 'monthly', 'upgrade']).alter()
    })
  }
}

module.exports = AddInvoicesAddonsSchema
