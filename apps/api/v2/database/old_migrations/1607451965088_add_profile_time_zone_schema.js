'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddProfileTimeZoneSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      table.string('timeZone', 255).notNullable().defaultTo('America/Buenos_Aires').after('week')
    })
  }

  down() {
    this.table('profiles', (table) => {
      // reverse alternations
      table.dropColumn('timeZone')
    })
  }
}

module.exports = AddProfileTimeZoneSchema
