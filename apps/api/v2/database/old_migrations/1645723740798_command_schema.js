'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CommandSchema extends Schema {
  up () {
    this.table('commands', (table) => {
      // alter table
      table.json('fees').after('status')
      table.json('formsPayment').after('fees')
    })
  }

  down () {
    this.table('commands', (table) => {
      // reverse alternations
      table.dropColumn('fees')
      table.dropColumn('formsPayment')
    })
  }
}

module.exports = CommandSchema
