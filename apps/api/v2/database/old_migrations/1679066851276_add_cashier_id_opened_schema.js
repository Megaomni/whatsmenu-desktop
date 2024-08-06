'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCashierIdOpenedSchema extends Schema {
  up () {
    this.table('table_openeds', (table) => {
      table.integer('cashierId').nullable().unsigned().references('id').inTable('cashiers').after('tableId')
      // alter table
    })
  }

  down () {
    this.table('table_openeds', (table) => {
      table.dropForeign('cashierId', 'table_openeds_cashierid_foreign')
      table.dropColumn('cashierId')
    })
  }
}

module.exports = AddCashierIdOpenedSchema
