'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddSellerSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.integer('sellerId').after('password').nullable().unsigned().references('id').inTable('sellers')
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropColumn('sellerId')
    })
  }
}

module.exports = AddSellerSchema
