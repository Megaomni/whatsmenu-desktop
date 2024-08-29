import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateComplementsSchema extends BaseSchema {
  protected tableName = 'complements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('name', 500).notNullable()
      table.enum('type', ['default', 'pizza', 'hibrid']).notNullable().defaultTo('default')
      table.integer('order').notNullable().defaultTo(0)
      table.integer('min').nullable()
      table.integer('max').nullable()
      table.boolean('required').notNullable().defaultTo(false)
      table
        .json('itens')
        .notNullable()
        .comment('{"name":"nome","description":"descrição","value":5,"status":true}')
      table.timestamps()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
