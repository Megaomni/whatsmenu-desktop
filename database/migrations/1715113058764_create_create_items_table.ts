import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.uuid('itemId').unique()
      table.string('orderId')
      table.integer('index')
      table.string('uniqueId').unique()
      table.string('name')
      table.string('ean')
      table.integer('quantity')
      table.string('unit')
      table.float('unitPrice')
      table.float('optionsPrice')
      table.float('totalPrice')
      table.float('price')
      table.string('observations')
      table.string('imageUrl')

      // Chave estrangeira
      table.foreign('orderId').references('orderId').inTable('orders')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
