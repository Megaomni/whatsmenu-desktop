'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FeesSchema extends Schema {
  up() {
    this.table('fees', (table) => {
      // alter table
      table.enu('type', ['percent', 'fixed']).notNullable().alter()
      table.boolean('automatic').notNullable().defaultTo(1).after('status')
    })
  }

  down() {
    this.table('fees', (table) => {
      // reverse alternations
      table.dropColumn('automatic')
    })
  }
}

module.exports = FeesSchema
