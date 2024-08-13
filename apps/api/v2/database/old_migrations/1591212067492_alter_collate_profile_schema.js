'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterCollateProfileSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      // alter table
      table.string('name').notNullable().collate('utf8mb4_general_ci').alter()
      table.string('description', 5000).nullable().defaultTo(null).collate('utf8mb4_general_ci').alter()
    })
  }

  down() {
    this.table('profiles', (table) => {
      // reverse alternations
      table.string('name').notNullable().alter()
      table.string('description', 5000).nullable().defaultTo(null).alter()
    })
  }
}

module.exports = AlterCollateProfileSchema
