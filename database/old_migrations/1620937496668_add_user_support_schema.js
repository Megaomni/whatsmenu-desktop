'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUserSupportSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.integer('supportId').unsigned().nullable().defaultTo(null).references('id').inTable('users').after('sellerId')
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropForeign('supportId', 'users_supportid_foreign');
      table.dropColumn('supportId')
    })
  }
}

module.exports = AddUserSupportSchema
