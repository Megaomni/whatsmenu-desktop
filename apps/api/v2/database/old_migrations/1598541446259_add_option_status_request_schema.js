'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOptionStatusRequestSchema extends Schema {
  up() {
    this.table('requests', (table) => {
      table.enum('status', ['production', 'transport', 'delivered', 'canceled']).nullable().defaultTo(null).alter()
    })
  }

  down() {
    this.table('requests', (table) => {
      table.enum('status', ['production', 'transport']).nullable().defaultTo(null).alter()
    })
  }
}

module.exports = AddOptionStatusRequestSchema
