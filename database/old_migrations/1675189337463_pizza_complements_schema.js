'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PizzaComplementsSchema extends Schema {
  up() {
    this.create('pizza_complements', (table) => {
      table.increments()
      table.integer('pizzaId').notNullable().unsigned().references('id').inTable('pizza_products')
      table.integer('complementId').notNullable().unsigned().references('id').inTable('complements')
      table.timestamps()
    })
  }

  down() {
    this.drop('pizza_complements')
  }
}

module.exports = PizzaComplementsSchema
