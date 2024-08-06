'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddOrderProductsSchema extends Schema {
  up () {
    this.table('products', (table) => {
      // alter table
      table.integer('order').notNullable().defaultTo(0).after('status')
      table.string('name', 250).notNullable().collate('utf8mb4_general_ci').alter()
      table.string('description', 1000).nullable().collate('utf8mb4_general_ci').alter()
      table.string('image', 2000).nullable().collate('utf8mb4_general_ci').alter()
    })
  }

  down () {
    this.table('products', (table) => {
      // reverse alternations
      table.dropColumn('order')
      table.string('name', 250).notNullable().alter()
      table.string('description', 1000).nullable().alter()
      table.string('image', 2000).nullable().alter()
    })
  }
}

module.exports = AddOrderProductsSchema
