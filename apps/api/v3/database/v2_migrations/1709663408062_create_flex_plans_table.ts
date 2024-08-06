import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateFlexPlansSchema extends BaseSchema {
  protected tableName = 'flex_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('name', 255).nullable()
      table.enum('type', ['register', 'upgrade', 'promote']).notNullable().defaultTo('register')
      table.string('category', 255).nullable()
      table.boolean('status').nullable()
      table.float('monthly', 8, 2).nullable()
      table.float('semester', 8, 2).nullable()
      table.float('yearly', 8, 2).nullable()
      table.dateTime('deleted_at').nullable()
      table.timestamps()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
