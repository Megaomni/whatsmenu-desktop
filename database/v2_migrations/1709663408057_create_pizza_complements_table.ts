import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreatePizzaComplementsSchema extends BaseSchema {
  protected tableName = 'pizza_complements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('pizzaId').unsigned().notNullable()
      table.integer('complementId').unsigned().notNullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('pizzaId').references('id').inTable('pizza_products')
      table.foreign('complementId').references('id').inTable('complements')

      // Índices
      table.index('pizzaId')
      table.index('complementId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
