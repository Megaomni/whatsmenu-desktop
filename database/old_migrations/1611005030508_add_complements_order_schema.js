'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddComplementsOrderSchema extends Schema {
  up () {
    this.table('complements', (table) => {
      table.integer('order').after('name').notNullable().defaultTo(0)
    })
  }

  down () {
    this.table('complements', (table) => {
      table.dropColumn('order')
    })
  }
}

module.exports = AddComplementsOrderSchema
