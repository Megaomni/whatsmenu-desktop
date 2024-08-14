'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCupomRequestSchema extends Schema {
  up() {
    this.table('requests', (table) => {
      table.integer('cupomId').nullable().unsigned().references('id').inTable('cupons').after('profileId')
    })
  }

  down() {
    this.table('requests', (table) => {
      table.dropForeign('cupomId', 'requests_cupomid_foreign')
      table.dropColumn('cupomId')
    })
  }
}

module.exports = AddCupomRequestSchema
