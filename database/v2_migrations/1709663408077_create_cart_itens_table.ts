import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCartItensSchema extends BaseSchema {
  protected tableName = 'cart_itens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('cartId').unsigned().notNullable()
      table.integer('productId').unsigned().nullable()
      table.integer('pizzaId').unsigned().nullable()
      table.enum('type', ['default', 'pizza']).notNullable().defaultTo('default')
      table.integer('quantity').notNullable()
      table.string('obs', 600).nullable()
      table.json('details').notNullable()
      table.string('name', 400).nullable()
      table.json('controls').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('cartId').references('id').inTable('carts')
      table.foreign('productId').references('id').inTable('products')
      table.foreign('pizzaId').references('id').inTable('pizza_products')

      // Índices
      table.index('cartId', 'cart_itens_cartid_foreign')
      table.index('productId', 'cart_itens_productid_foreign')
      table.index('pizzaId', 'cart_itens_pizzaid_foreign')
      table.index('name', 'productName')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
