'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PizzaProductSchema extends Schema {
  up() {
    this.create('pizza_products', (table) => {
      table.increments()
      table.integer('categoryId').notNullable().unsigned().references('id').inTable('categories')
      table.boolean('status').notNullable().defaultTo(true)
      table
        .json('sizes')
        .notNullable()
        .comment(JSON.stringify([{ name: 'default', flavors: [1, 2, 3], status: true }]))
      table
        .json('flavors')
        .notNullable()
        .comment(
          JSON.stringify([
            {
              name: 'flavorName',
              description: 'flavorDescription',
              image: 'https://enderecodaimagem.com.br/imagem.jpg',
              values: [{ size1: 0 }, { size2: 0 }],
            },
          ])
        )
      table
        .json('implementations')
        .notNullable()
        .comment(
          JSON.stringify([
            { name: 'Borda de catupiry', value: 3 },
            { name: 'Borda Tradicional', value: 0 },
          ])
        )
      table.timestamps()
    })
  }

  down() {
    this.drop('pizza_products')
  }
}

module.exports = PizzaProductSchema
