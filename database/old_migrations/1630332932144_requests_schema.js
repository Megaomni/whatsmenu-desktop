'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RequestsSchema extends Schema {
  up () {
    this.table('requests', (table) => {
      table.integer('commandId').nullable().unsigned().references('id').inTable('commands').after('cupomId')
    })
  }

  down () {
    this.table('requests', (table) => {
      table.dropForeign('commandId', 'requests_commandid_foreign');
      table.dropColumn('commandId')
    })
  }
}

module.exports = RequestsSchema
