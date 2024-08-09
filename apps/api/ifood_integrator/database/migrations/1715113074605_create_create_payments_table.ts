import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('orderId')
      table.float('prepaid')
      table.float('pending')
      table.json('methods')
      table.json('additionalFees')

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
