'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvoicesSchema extends Schema {
  up() {
    this.create('invoices', (table) => {
      table.increments()
      table.integer('userId').unsigned().references('id').inTable('users').notNullable()
      table.enu('status', ['pending', 'paid', 'canceled']).index('status_index')
      table.enu('type', ['first', 'monthly', 'upgrade']).index('type_index')
      table.date('expiration').index('expiration_index')
      table.float('value')
      table.json('itens')
      table.timestamps()
    })
  }

  down() {
    this.drop('invoices')
  }
}

module.exports = InvoicesSchema
