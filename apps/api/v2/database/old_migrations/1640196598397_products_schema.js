'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProductsSchema extends Schema {
  up () {
    this.table('products', (table) => {
      // alter table
      table.float('valueTable').notNullable().defaultTo(0).after('promoteStatus')
      table.float('promoteValueTable').nullable().after('valueTable')
      table.boolean('promoteStatusTable').notNullable().defaultTo(false).after('promoteValueTable')

    })
  }

  down () {
    this.table('products', (table) => {
      // reverse alternations
      table.dropColumn('valueTable')
      table.dropColumn('promoteValueTable')
      table.dropColumn('promoteStatusTable')
    })
  }
}

module.exports = ProductsSchema
