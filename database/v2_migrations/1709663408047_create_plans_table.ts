import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreatePlansSchema extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('name', 500).notNullable()
      table.string('description', 1500).notNullable()
      table.json('controls').nullable()
      table.float('value', 8, 2).defaultTo(0.0)
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
