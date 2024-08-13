'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CashierSchema extends Schema {
  up () {
    this.create('cashiers', (table) => {
      table.increments()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.integer('bartenderId').nullable().unsigned().references('id').inTable('bartenders')
      table.float('initialValue').notNullable().defaultTo(0)
      table.json('transactions').nullable()
      table.json('closedValues_user')
      table.json('closedValues_system')
      table.json('controls').nullable()
      table.timestamp('closed_at').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('cashiers')
  }
}

module.exports = CashierSchema
