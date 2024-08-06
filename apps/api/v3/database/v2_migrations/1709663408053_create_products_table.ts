import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateProductsSchema extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('categoryId').unsigned().notNullable()
      table.boolean('status').notNullable().defaultTo(true)
      table.integer('order').notNullable().defaultTo(0)
      table.string('name', 250).notNullable()
      table.string('description', 1000).nullable()
      table.boolean('bypass_amount').defaultTo(true)
      table.integer('amount_alert').defaultTo(0)
      table.integer('amount').defaultTo(0)
      table.float('value', 8, 2).notNullable().defaultTo(0.0)
      table.float('promoteValue', 8, 2).nullable()
      table.boolean('promoteStatus').notNullable().defaultTo(false)
      table.float('valueTable', 8, 2).notNullable().defaultTo(0.0)
      table.float('promoteValueTable', 8, 2).nullable()
      table.boolean('promoteStatusTable').notNullable().defaultTo(false)
      table.integer('countRequests').notNullable().defaultTo(0)
      table.string('image', 2000).nullable()
      table.json('disponibility').nullable().comment('armazena array de IDs de complementos')
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('categoryId').references('id').inTable('categories')

      // Índices
      table.index(['deleted_at', 'categoryId'], 'deleted_from_category')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
