'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Command = use('App/Models/Command')

class TablesOpenedSchema extends Schema {
  up() {
    this.create('table_openeds', (table) => {
      table.increments()
      table.integer('tableId').notNullable().unsigned().references('id').inTable('tables')
      table.boolean('status')
      table.json('fees')
      table.json('formsPayment')
      table.timestamps()
    })
  }

  down() {
    this.table('table_openeds', (table) => {
      table.dropForeign('tableId', 'table_openeds_tableid_foreign')
    })
    this.drop('table_openeds')
  }
}

module.exports = TablesOpenedSchema
