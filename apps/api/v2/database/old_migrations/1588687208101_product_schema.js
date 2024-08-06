'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProductSchema extends Schema {
  up () {
    this.create('products', (table) => {
      table.increments()
      table.integer('categoryId').notNullable().unsigned().references('id').inTable('categories')
      table.boolean('status').notNullable().defaultTo(true)
      table.string('name', 250).notNullable()
      table.string('description', 1000).nullable()
      table.float('value').notNullable().defaultTo(0)
      table.float('promoteValue').nullable()
      table.boolean('promoteStatus').notNullable().defaultTo(false)
      table.string('image', 2000).nullable()
      table.json('disponibility').nullable().comment('armazena array de IDs de complementos')
      // table.json('disponibility').nullable().defaultTo(JSON.stringify([])).comment('armazena array de IDs de complementos')
      table.timestamps()
    })
  }

  down () {
    this.drop('products')
  }
}

module.exports = ProductSchema
