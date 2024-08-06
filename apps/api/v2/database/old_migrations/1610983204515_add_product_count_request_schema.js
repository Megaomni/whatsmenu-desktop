'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddProductCountRequestSchema extends Schema {
  up () {
    this.table('products', (table) => {
      table.integer('countRequests').after('promoteStatus').notNullable().defaultTo(0)
    })
  }

  down () {
    this.table('products', (table) => {
      table.dropColumn('countRequests')
    })
  }
}

module.exports = AddProductCountRequestSchema
