'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPrintControlRequestsSchema extends Schema {
  up () {
    this.table('requests', (table) => {
      table.boolean('print').defaultTo(false).index('request_print').after('total')
      table.integer('tentatives').defaultTo(0).index('request_tentatives').after('print')
      table.index(['print', 'tentatives'], 'requests_print_tentatives')
    })
  }

  down () {
    this.table('requests', (table) => {
      table.dropIndex(['print', 'tentatives'], 'requests_print_tentatives')
      table.dropIndex('print', 'request_print')
      table.dropIndex('tentatives', 'request_tentatives')
      table.dropColumn('print')
      table.dropColumn('tentatives')
    })
  }
}

module.exports = AddPrintControlRequestsSchema
