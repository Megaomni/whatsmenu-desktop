'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCupomMinValueSchema extends Schema {
  up() {
    this.table('cupons', (table) => {
      table.float('minValue').notNullable().defaultTo(0).after('value')
    })
  }

  down() {
    this.table('cupons', (table) => {
      table.dropColumn('minValue')
    })
  }
}

module.exports = AddCupomMinValueSchema
