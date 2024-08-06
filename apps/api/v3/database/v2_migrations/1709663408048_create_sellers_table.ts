import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateSellersSchema extends BaseSchema {
  protected tableName = 'sellers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('name', 300).notNullable()
      table.string('contact', 250).nullable()
      table.boolean('status').notNullable().defaultTo(true)
      table.float('commission', 8, 2).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
