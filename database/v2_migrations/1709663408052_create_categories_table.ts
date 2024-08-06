import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCategoriesSchema extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.string('name', 250).notNullable().defaultTo('')
      table.integer('order').notNullable().defaultTo(0)
      table.integer('status').notNullable().defaultTo(1)
      table.enum('type', ['default', 'pizza']).notNullable().defaultTo('default')
      table.json('disponibility').nullable()
      table.json('options').nullable()
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índices
      table.index('profileId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
