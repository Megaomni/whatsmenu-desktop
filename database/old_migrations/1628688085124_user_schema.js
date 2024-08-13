'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.string('security_key', 60).after('password')
      // alter table
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropColumn('security_key')
    })
  }
}

module.exports = UserSchema
