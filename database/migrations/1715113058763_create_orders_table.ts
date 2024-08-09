import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('orderId').unique()
      table.string('orderStatus')
      table.string('statusCode')
      table.string('merchantId')
      table.string('customerId')
      table.string('displayId').unique()
      table.string('orderTiming')
      table.string('orderType')
      table.json('delivery')
      table.json('total')
      table.json('additionalInfo')

      // Chave estrangeira
      table.foreign('merchantId').references('merchantId').inTable('merchants')

      // Chave estrangeira
      table.foreign('customerId').references('customerId').inTable('customers').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
