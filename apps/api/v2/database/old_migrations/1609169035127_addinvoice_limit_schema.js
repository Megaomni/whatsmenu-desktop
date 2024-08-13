'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddinvoiceLimitSchema extends Schema {
  up () {
    this.table('system_requests', (table) => {
      // alter table
      table.date('limit').nullable().after('expiration')
      table.boolean('unlocked').notNullable().default(0).after('status')
      table.timestamp('blocked_at').nullable().after('paghiper')
    })
  }

  down () {
    this.table('system_requests', (table) => {
      // reverse alternations
      table.dropColumn('limit')
      table.dropColumn('unlocked')
      table.dropColumn('blocked_at')
    })
  }
}

module.exports = AddinvoiceLimitSchema
