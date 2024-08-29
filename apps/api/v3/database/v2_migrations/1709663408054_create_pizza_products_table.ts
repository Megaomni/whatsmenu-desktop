import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreatePizzaProductsSchema extends BaseSchema {
  protected tableName = 'pizza_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('categoryId').unsigned().notNullable()
      table.boolean('status').notNullable().defaultTo(true)
      table
        .json('sizes')
        .notNullable()
        .comment('[{"name":"default","flavors":[1,2,3],"status":true}]')
      table
        .json('flavors')
        .notNullable()
        .comment(
          '[{"name":"flavorName","description":"flavorDescription","image":"https://enderecodaimagem.com.br/imagem.jpg","values":[{"size1":0},{"size2":0}]}]'
        )
      table
        .json('implementations')
        .notNullable()
        .comment('[{"name":"Borda de catupiry","value":3},{"name":"Borda Tradicional","value":0}]')
      table.integer('amount_alert').defaultTo(0)
      table.boolean('bypass_amount').defaultTo(true)
      table.integer('amount').defaultTo(0)
      table.json('disponibility').nullable()
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('categoryId').references('id').inTable('categories')

      // Índices
      table.index('categoryId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
