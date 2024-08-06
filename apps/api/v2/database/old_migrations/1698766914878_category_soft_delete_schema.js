'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategorySoftDeleteSchema extends Schema {
  up() {
    this.table('categories', (table) => {
      table.datetime('deleted_at').nullable().defaultTo(null).after('options')
    })
  }

  down() {
    this.table('categories', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}

module.exports = CategorySoftDeleteSchema
