'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PizzaSoftDeleteSchema extends Schema {
  up() {
    this.table('pizza_products', (table) => {
      table.datetime('deleted_at').nullable().defaultTo(null).after('disponibility')
    })
  }

  down() {
    this.table('pizza_products', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}

module.exports = PizzaSoftDeleteSchema
