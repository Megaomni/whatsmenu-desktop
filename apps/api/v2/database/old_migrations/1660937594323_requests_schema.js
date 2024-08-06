'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RequestsSchema extends Schema {
  up () {
    this.table('requests', (table) => {
      table.integer('bartenderId').nullable().unsigned().references('id').inTable('bartenders').after('commandId')
    })
  }

  down () {
    this.table('requests', (table) => {
      table.dropForeign('bartenderId', 'requests_bartenderid_foreign');
      table.dropColumn('bartenderId')
    })
  }
}

module.exports = RequestsSchema
