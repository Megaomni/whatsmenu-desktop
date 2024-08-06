'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProductSoftDeleteSchema extends Schema {
  up () {
    this.table('products', (table) => {
      table.datetime('deleted_at').nullable().defaultTo(null).after("disponibility");
    })
  }

  down () {
    this.table('products', (table) => {
      table.dropColumn("deleted_at");
    })
  }
}

module.exports = ProductSoftDeleteSchema
