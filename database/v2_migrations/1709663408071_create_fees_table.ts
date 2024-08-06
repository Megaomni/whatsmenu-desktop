import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateFeesSchema extends BaseSchema {
  protected tableName = 'fees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().nullable()
      table.string('code', 200).notNullable()
      table.enum('type', ['percent', 'fixed']).notNullable()
      table.float('value', 8, 2).notNullable()
      table.tinyint('status').notNullable().defaultTo(1)
      table.tinyint('automatic').notNullable().defaultTo(1)
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índice
      table.unique(['profileId', 'code'], 'fees_profileid_code_unique')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
