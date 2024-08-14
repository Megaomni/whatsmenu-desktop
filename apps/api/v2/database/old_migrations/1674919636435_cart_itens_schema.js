'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CartItensSchema extends Schema {
  up() {
    this.create('cart_itens', (table) => {
      table.increments()
      table.integer('cartId').notNullable().unsigned().references('id').inTable('carts')
      table.integer('productId').unsigned().references('id').inTable('products')
      table.integer('pizzaId').nullable().unsigned().references('id').inTable('pizza_products')
      table.enum('type', ['default', 'pizza']).notNullable().defaultTo('default')
      table.integer('quantity').notNullable()
      table.string('obs', 600).nullable()
      table.json('details').notNullable()
      table.string('name', 400)
      table.json('controls').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('cart_itens')
  }
}

module.exports = CartItensSchema
