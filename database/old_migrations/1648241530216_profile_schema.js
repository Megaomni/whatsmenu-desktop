'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfileSchema extends Schema {
  up () {
    this.table('profiles', (table) => {
      // alter table
      table.integer('command').defaultTo(0).after('request')
    })
  }

  down () {
    this.table('profiles', (table) => {
      // reverse alternations
      table.dropColumn('command')
    })
  }
}

module.exports = ProfileSchema
