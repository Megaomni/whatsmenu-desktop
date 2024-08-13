'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfileOptionsSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      table.json('options').after('week')
    })
  }

  down() {
    this.table('profiles', (table) => {
      table.dropColumn('options')
    })
  }
}

module.exports = ProfileOptionsSchema
