'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeInvoiceSchema extends Schema {
  up() {
    this.table('system_requests', (table) => {
      // alter table
      table.enu('type', ['M', 'A']).notNullable().defaultTo('M').after('status')
    })
  }

  down() {
    this.table('system_requests', (table) => {
      // reverse alternations
      table.dropColumn('type')
    })
  }
}

module.exports = AddTypeInvoiceSchema
