import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateProductComplementsSchema extends BaseSchema {
  protected tableName = 'product_complements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('productId').unsigned().notNullable()
      table.integer('complementId').unsigned().notNullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('productId').references('id').inTable('products')
      table.foreign('complementId').references('id').inTable('complements')

      // Índices
      table.index('productId')
      table.index('complementId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
