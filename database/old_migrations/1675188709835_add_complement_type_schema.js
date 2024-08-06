'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddComplementTypeSchema extends Schema {
  up() {
    this.table('complements', (table) => {
      table.enum('type', ['default', 'pizza', 'hibrid']).notNullable().defaultTo('default').after('name')
    })
  }

  down() {
    this.table('complements', (table) => {
      table.dropColumn('type')
      // reverse alternations
    })
  }
}

module.exports = AddComplementTypeSchema
