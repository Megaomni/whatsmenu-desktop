import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateSystemProductsSchema extends BaseSchema {
  protected tableName = 'system_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('plan_id').unsigned().nullable()
      table.string('name', 255).notNullable()
      table.string('description', 500).nullable()
      table.tinyint('status').notNullable().defaultTo(1)
      table.string('service', 255).notNullable()
      table.string('default_price', 255).notNullable()
      table.json('operations').nullable()
      table.timestamps()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
