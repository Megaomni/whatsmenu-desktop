'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategoriesSchema extends Schema {
  up() {
    this.table('categories', (table) => {
      // alter table
      table.enum('disponibility', ['all', 'delivery', 'table']).after('type').defaultTo('all').notNullable()
    })
  }

  down() {
    this.table('categories', (table) => {
      // reverse alternations
      table.dropColumn('disponibility')
    })
  }
}

module.exports = CategoriesSchema
