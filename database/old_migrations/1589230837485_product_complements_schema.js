'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProductComplementsSchema extends Schema {
  up () {
    this.create('product_complements', (table) => {
      table.increments()
      table.integer('productId').notNullable().unsigned().references('id').inTable('products')
      table.integer('complementId').notNullable().unsigned().references('id').inTable('complements')
      table.timestamps()
    })
  }

  down () {
    this.drop('product_complements')
  }
}

module.exports = ProductComplementsSchema
