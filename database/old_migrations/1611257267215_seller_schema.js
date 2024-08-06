'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SellerSchema extends Schema {
  up () {
    this.create('sellers', (table) => {
      table.increments()
      table.string('name', 300).notNullable()
      table.string('contact', 250).nullable()
      table.boolean('status').notNullable().defaultTo(true)
      table.float('commission').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('sellers')
  }
}

module.exports = SellerSchema
